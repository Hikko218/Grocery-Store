import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create.order.dto';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class OrderService {
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get all orders for a user
  async getOrders(userId: number): Promise<ResponseOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
    });
    return orders.map((o) => plainToInstance(ResponseOrderDto, o));
  }

  // Create order
  async createOrder(data: CreateOrderDto): Promise<ResponseOrderDto> {
    const order = await this.prisma.order.create({
      data,
    });
    return plainToInstance(ResponseOrderDto, order);
  }

  // Update order
  async updateOrder(
    orderId: number,
    data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data,
    });
    return plainToInstance(ResponseOrderDto, order);
  }

  // Delete order
  async deleteOrder(orderId: number): Promise<ResponseOrderDto> {
    const order = await this.prisma.order.delete({
      where: { id: orderId },
    });
    return plainToInstance(ResponseOrderDto, order);
  }
}
