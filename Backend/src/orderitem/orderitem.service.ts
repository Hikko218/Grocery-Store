// import { Prisma, OrderItem } from '@prisma/client';
// import { Prisma, OrderItem } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create.orderitem.dto';
import { UpdateOrderItemDto } from './dto/update.orderitem.dto';
import { ResponseOrderItemDto } from './dto/response.orderitem.dto';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class OrderItemService {
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get all order items for an order
  async getOrderItems(orderId: number): Promise<ResponseOrderItemDto[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });
    return items.map((item) => plainToInstance(ResponseOrderItemDto, item));
  }

  // Create order item
  async createOrderItem(
    data: CreateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    const item = await this.prisma.orderItem.create({
      data,
    });
    return plainToInstance(ResponseOrderItemDto, item);
  }

  // Update order item
  async updateOrderItem(
    orderItemId: number,
    data: UpdateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    const item = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data,
    });
    return plainToInstance(ResponseOrderItemDto, item);
  }

  // Delete order item
  async deleteOrderItem(orderItemId: number): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id: orderItemId },
    });
  }
}
