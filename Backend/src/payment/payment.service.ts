import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

// Service for payment processing and Stripe integration
@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {
    // Initialize Stripe client
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  }

  // Ensure Stripe is properly configured
  private ensureStripeConfigured(): void {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    // Reject obvious placeholder/invalid keys
    if (
      !key ||
      !key.startsWith('sk_') ||
      key.length < 20 ||
      /sk_test_x+/.test(key)
    ) {
      throw new BadRequestException('Payments are not configured');
    }
  }

  // Convert amount to minor units (e.g. cents)
  private toMinor(amount: unknown): number {
    const n = Number(amount ?? 0);
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
  }

  // Ensure Stripe customer exists for user
  private async ensureStripeCustomer(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email ?? undefined,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      metadata: { userId: String(user.id) },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  // Create order and Stripe payment intent
  async createOrderAndIntent(opts: {
    userId: number;
    shipping: {
      name: string;
      street: string;
      street2?: string | null;
      postalCode: string;
      city: string;
      country: string;
      phone?: string | null;
    };
  }): Promise<{ orderId: number; clientSecret: string }> {
    this.ensureStripeConfigured();

    const { userId, shipping } = opts;

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const total = cart.items.reduce((sum, it) => {
      const price = Number(it.product.price ?? 0);
      return sum + price * it.quantity;
    }, 0);

    const customerId = await this.ensureStripeCustomer(userId);

    // 1) Create the PaymentIntent first — fail fast if Stripe is misconfigured
    const intent: Stripe.PaymentIntent =
      await this.stripe.paymentIntents.create({
        amount: this.toMinor(total),
        currency: 'eur',
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: 'TBD', userId: String(userId) }, // updated after order is created
      });

    const clientSecret = intent.client_secret;
    if (!clientSecret)
      throw new BadRequestException('Stripe client secret missing');

    // 2) Create order + items and clear cart atomically
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            totalPrice: total,
            shippingName: shipping.name,
            shippingStreet: shipping.street,
            shippingStreet2: shipping.street2 ?? null,
            shippingPostalCode: shipping.postalCode,
            shippingCity: shipping.city,
            shippingCountry: shipping.country,
            shippingPhone: shipping.phone ?? null,
            paymentProvider: 'stripe',
            paymentStatus: 'PROCESSING',
            stripePaymentIntentId: intent.id,
            items: {
              create: cart.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                price: it.product.price ?? 0,
              })),
            },
          },
        });

        // Leere den Cart des Users idempotent
        await tx.cart.update({
          where: { id: cart.id },
          data: { items: { deleteMany: {} } },
        });

        return created;
      });

      // Ergänze PI-Metadaten (orderId + userId) für den Webhook
      await this.stripe.paymentIntents.update(intent.id, {
        metadata: { orderId: String(order.id), userId: String(userId) },
      });

      return { orderId: order.id, clientSecret };
    } catch (e) {
      try {
        await this.stripe.paymentIntents.cancel(intent.id);
      } catch (err) {
        void err;
      }
      throw e;
    }
  }

  // Apply Stripe payment success to order
  async applyStripeSuccess(pi: Stripe.PaymentIntent): Promise<void> {
    const orderId = Number(pi.metadata?.orderId);
    if (!Number.isFinite(orderId)) return;

    let chargeId: string | null = null;
    if (typeof pi.latest_charge === 'string') chargeId = pi.latest_charge;
    else if (
      pi.latest_charge &&
      typeof (pi.latest_charge as { id?: unknown }).id === 'string'
    ) {
      chargeId = (pi.latest_charge as { id: string }).id;
    }

    let cardBrand: string | null = null;
    let cardLast4: string | null = null;
    let receiptUrl: string | null = null;

    if (chargeId) {
      const ch = await this.stripe.charges.retrieve(chargeId);
      const pmd = ch.payment_method_details;
      if (pmd?.type === 'card' && pmd.card) {
        cardBrand = pmd.card.brand ?? null;
        cardLast4 = pmd.card.last4 ?? null;
      }
      receiptUrl = ch.receipt_url ?? null;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCEEDED',
        paidAt: new Date(),
        stripeChargeId: chargeId,
        stripeReceiptUrl: receiptUrl,
        cardBrand,
        cardLast4,
      },
    });

    // Fallback: Cart leeren anhand userId (idempotent)
    const metaUserId = Number(pi.metadata?.userId);
    if (Number.isFinite(metaUserId)) {
      const cartRow = await this.prisma.cart.findUnique({
        where: { userId: metaUserId },
        select: { id: true },
      });
      if (cartRow) {
        await this.prisma.cartItem.deleteMany({
          where: { cartId: cartRow.id },
        });
      }
    }
  }

  // Apply Stripe payment failure to order
  async applyStripeFailure(pi: Stripe.PaymentIntent): Promise<void> {
    const orderId = Number(pi.metadata?.orderId);
    if (!Number.isFinite(orderId)) return;
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'FAILED' },
    });
  }
}
