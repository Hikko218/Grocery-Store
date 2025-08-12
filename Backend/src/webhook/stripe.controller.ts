import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PaymentService } from '../payment/payment.service';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

function toEvent(raw: Buffer, sig: string, secret: string): Stripe.Event {
  try {
    return stripeClient.webhooks.constructEvent(raw, sig, secret);
  } catch {
    throw new BadRequestException('Invalid signature');
  }
}

function getPaymentIntent(obj: unknown): Stripe.PaymentIntent {
  if (
    obj &&
    typeof obj === 'object' &&
    typeof (obj as { object?: unknown }).object === 'string' &&
    (obj as { object: string }).object === 'payment_intent'
  ) {
    return obj as Stripe.PaymentIntent;
  }
  throw new BadRequestException('Unexpected event payload');
}

@Controller('webhook/stripe')
export class StripeWebhookController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly payments: PaymentService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig?: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!sig || !secret)
      throw new BadRequestException('Missing webhook config');

    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('Missing raw body');

    const event = toEvent(raw, sig, secret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = getPaymentIntent(event.data.object);
        await this.payments.applyStripeSuccess(pi);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = getPaymentIntent(event.data.object);
        await this.payments.applyStripeFailure(pi);
        break;
      }
      default:
        break;
    }
    return { received: true };
  }
}
