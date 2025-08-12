import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create.orderitem.dto';
import { UpdateOrderItemDto } from './dto/update.orderitem.dto';
import { ResponseOrderItemDto } from './dto/response.orderitem.dto';
import type { OrderItem } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Service for order item management and database operations
@Injectable()
export class OrderItemService {
  // Inject PrismaService for DB access
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Map DB entity to response DTO
  private toResponse(item: OrderItem): ResponseOrderItemDto {
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price !== null ? Number(item.price) : null,
      createdAt: item.createdAt,
    };
  }

  // Get all order items for a specific order
  async getOrderItems(orderId: number): Promise<ResponseOrderItemDto[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });
    return items.map((item) => this.toResponse(item));
  }

  // Create a new order item
  async createOrderItem(
    data: CreateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    const item = await this.prisma.orderItem.create({
      data: {
        ...data,
        // Ensure price is stored as Prisma.Decimal
        ...(data.price !== undefined && data.price !== null
          ? {
              price:
                typeof data.price === 'number'
                  ? data.price
                  : new Prisma.Decimal(data.price),
            }
          : {}),
      },
    });
    return this.toResponse(item);
  }

  // Update an existing order item
  async updateOrderItem(
    orderItemId: number,
    data: UpdateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    if (!orderItemId) throw new BadRequestException('OrderItem ID is required');
    const item = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        ...data,
        // Ensure price is stored as Prisma.Decimal
        ...(data.price !== undefined && data.price !== null
          ? {
              price:
                typeof data.price === 'number'
                  ? data.price
                  : new Prisma.Decimal(data.price),
            }
          : {}),
      },
    });
    return this.toResponse(item);
  }

  // Delete an order item by ID
  async deleteOrderItem(orderItemId: number): Promise<void> {
    if (!orderItemId) throw new BadRequestException('OrderItem ID is required');
    await this.prisma.orderItem.delete({ where: { id: Number(orderItemId) } });
  }
}
