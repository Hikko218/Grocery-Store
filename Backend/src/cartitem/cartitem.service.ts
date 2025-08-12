import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto } from './dto/create.cartitem.dto';
import { UpdateCartItemDto } from './dto/update.cartitem.dto';
import { ResponseCartItemDto } from './dto/response.cartitem.dto';
import type { CartItem } from '@prisma/client';

// Service encapsulates cart item business logic and DB access (Prisma)
@Injectable()
export class CartItemService {
  // Inject Prisma client
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Convert CartItem model to response DTO
  private toResponse(item: CartItem): ResponseCartItemDto {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: item.createdAt,
    };
  }

  // Create a new cart item
  async create(dto: CreateCartItemDto): Promise<ResponseCartItemDto> {
    const item = await this.prisma.cartItem.create({
      data: {
        cartId: Number(dto.cartId),
        productId: dto.productId,
        quantity: Number(dto.quantity ?? 1),
      },
    });
    return this.toResponse(item);
  }

  // Find all cart items; optionally filter by cartId
  async findAll(cartId?: number): Promise<ResponseCartItemDto[]> {
    const items = await this.prisma.cartItem.findMany({
      where: cartId ? { cartId } : {},
    });
    return items.map((item) => this.toResponse(item));
  }

  // Find a single cart item by ID
  async findOne(id: number): Promise<ResponseCartItemDto> {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('CartItem not found');
    return this.toResponse(item);
  }

  // Update a cart item
  async update(
    id: number,
    dto: UpdateCartItemDto,
  ): Promise<ResponseCartItemDto> {
    const item = await this.prisma.cartItem.update({
      where: { id },
      data: {
        quantity: dto.quantity,
      },
    });
    return this.toResponse(item);
  }

  // Delete a cart item
  async remove(id: number): Promise<{ success: boolean }> {
    await this.prisma.cartItem.delete({ where: { id } });
    return { success: true };
  }
}
