import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create.cart.dto';
import { UpdateCartDto } from './dto/update.cart.dto';
import { ResponseCartDto } from './dto/response.cart.dto';
import type { Cart } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Convert Cart entity to response DTO
  private toResponse(cart: Cart): ResponseCartDto {
    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt.toISOString(), // string statt Date
      totalPrice: cart.totalPrice ? Number(cart.totalPrice) : 0,
    };
  }

  // Create a cart for the user
  async createCart(dto: CreateCartDto): Promise<ResponseCartDto> {
    const existing = await this.prisma.cart.findUnique({
      where: { userId: Number(dto.userId) },
    });
    if (existing) throw new BadRequestException('Cart already exists for user');
    const newCart = await this.prisma.cart.create({
      data: {
        userId: Number(dto.userId),
        totalPrice: 0,
      },
    });
    return this.toResponse(newCart);
  }

  // Find cart by userId
  async findOneByUserId(userId: number): Promise<ResponseCartDto | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });
    return cart ? this.toResponse(cart) : null;
  }

  // Update cart (e.g. totalPrice)
  async updateCart(id: number, dto: UpdateCartDto): Promise<ResponseCartDto> {
    const updated = await this.prisma.cart.update({
      where: { id },
      data: {
        totalPrice:
          dto.totalPrice === undefined
            ? undefined
            : typeof dto.totalPrice === 'number'
              ? dto.totalPrice
              : new Prisma.Decimal(dto.totalPrice),
      },
    });
    await this.recalculateCartTotal(id);
    return this.toResponse(updated);
  }

  // Delete cart by id
  async deleteCart(id: number): Promise<{ success: boolean }> {
    const cart = await this.prisma.cart.findUnique({ where: { id } });
    if (!cart) throw new NotFoundException('Cart not found');
    await this.prisma.cart.delete({ where: { id } });
    return { success: true };
  }

  // Calculate and update the total price of the cart
  async recalculateCartTotal(cartId: number): Promise<number> {
    // Get all cart items including product price
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
    });

    // Calculate total price
    const total = items.reduce((sum, item) => {
      const price = item.product?.price ? Number(item.product.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    // Update total price in cart
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { totalPrice: new Prisma.Decimal(total) },
    });

    return total;
  }
}
