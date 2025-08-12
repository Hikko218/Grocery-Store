import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create.order.dto';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';
import { Order as OrderModel } from '@prisma/client';

function toOrderResponse(o: OrderModel): ResponseOrderDto {
  const totalPrice = o.totalPrice ? Number(o.totalPrice) : 0;
  const createdAt =
    o.createdAt instanceof Date
      ? o.createdAt.toISOString()
      : new Date(String(o.createdAt)).toISOString();

  return {
    id: o.id,
    userId: o.userId,
    totalPrice,
    createdAt,
    shippingName: String(o.shippingName),
    shippingStreet: String(o.shippingStreet),
    shippingStreet2:
      o.shippingStreet2 != null ? String(o.shippingStreet2) : null,
    shippingPostalCode: String(o.shippingPostalCode),
    shippingCity: String(o.shippingCity),
    shippingCountry: String(o.shippingCountry),
    shippingPhone: o.shippingPhone != null ? String(o.shippingPhone) : null,
  };
}

// Service for order management and database operations
@Injectable()
export class OrderService {
  // Inject PrismaService for DB access
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Convert Order model to response DTO
  // Create a new order from cart data
  async create(data: CreateOrderDto): Promise<ResponseOrderDto> {
    // Cart-Total (oder 0, falls kein Cart vorhanden)
    const cart = await this.prisma.cart.findUnique({
      where: { userId: data.userId },
      select: { totalPrice: true },
    });
    const totalPrice = Number(cart?.totalPrice ?? 0);

    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        totalPrice,
        shippingName: data.shippingName,
        shippingStreet: data.shippingStreet,
        shippingStreet2: data.shippingStreet2 ?? null,
        shippingPostalCode: data.shippingPostalCode,
        shippingCity: data.shippingCity,
        shippingCountry: data.shippingCountry,
        shippingPhone: data.shippingPhone ?? null,
      },
    });
    return toOrderResponse(order);
  }

  // Get all orders for a user
  async findByUser(userId: number): Promise<ResponseOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  // Update an existing order
  async update(
    orderId: number,
    data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    const exists = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!exists) throw new NotFoundException('Order not found');

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalPrice: data.totalPrice ?? undefined,
        shippingName: data.shippingName ?? undefined,
        shippingStreet: data.shippingStreet ?? undefined,
        shippingStreet2: data.shippingStreet2 ?? undefined,
        shippingPostalCode: data.shippingPostalCode ?? undefined,
        shippingCity: data.shippingCity ?? undefined,
        shippingCountry: data.shippingCountry ?? undefined,
        shippingPhone: data.shippingPhone ?? undefined,
      },
    });
    return toOrderResponse(order);
  }

  // Delete an order by ID
  async delete(orderId: number): Promise<{ success: boolean }> {
    const exists = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!exists) throw new NotFoundException('Order not found');
    await this.prisma.order.delete({ where: { id: orderId } });
    return { success: true };
  }

  // Test compatibility wrappers for create, get, update, delete
  async createOrder(userId: number): Promise<ResponseOrderDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { totalPrice: true },
    });
    const totalPrice = Number(cart?.totalPrice ?? 0);
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalPrice,
        // minimale Pflichtfelder für Shipping (Tests liefern keine Daten)
        shippingName: 'Unknown',
        shippingStreet: '-',
        shippingPostalCode: '-',
        shippingCity: '-',
        shippingCountry: '-',
      },
    });
    return toOrderResponse(order);
  }

  async getOrders(userId: number): Promise<ResponseOrderDto[]> {
    return this.findByUser(userId);
  }

  async updateOrder(
    orderId: number,
    data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    return this.update(orderId, data);
  }

  async deleteOrder(orderId: number): Promise<{ success: boolean }> {
    return this.delete(orderId);
  }
}
