import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';
import { Prisma, Order } from '@prisma/client';

function toOrderResponse(o: Order): ResponseOrderDto {
  return {
    id: o.id,
    userId: o.userId,
    totalPrice:
      o.totalPrice !== null && o.totalPrice !== undefined
        ? Number(o.totalPrice)
        : 0,
    createdAt: o.createdAt,
  };
}

@Injectable()
export class OrderService {
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get all orders for a user
  async getOrders(userId: number): Promise<ResponseOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId: Number(userId) },
    });
    return orders.map(toOrderResponse);
  }

  // Create order using the current cart price for the user
  async createOrder(userId: number): Promise<ResponseOrderDto> {
    // Get the user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId: Number(userId) },
    });
    if (!cart) throw new Error('Cart not found');

    // Create the order with the cart's total price
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalPrice: cart.totalPrice,
      },
    });

    return toOrderResponse(order);
  }

  // Update order
  async updateOrder(
    orderId: number,
    data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    const order = await this.prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        ...data,
        totalPrice:
          typeof data.totalPrice === 'number'
            ? data.totalPrice
            : new Prisma.Decimal(data.totalPrice ?? 0),
      },
    });
    return toOrderResponse(order);
  }

  // Delete order
  async deleteOrder(orderId: number): Promise<void> {
    await this.prisma.order.delete({ where: { id: Number(orderId) } });
  }
}
