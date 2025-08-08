import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto } from './dto/create.cartitem.dto';
import { UpdateCartItemDto } from './dto/update.cartitem.dto';
import { ResponseCartItemDto } from './dto/response.cartitem.dto';
import { plainToInstance } from 'class-transformer';

// Service encapsulates cart item business logic and DB access (Prisma)
@Injectable()
export class CartItemService {
  // Inject Prisma client
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Create a new cart item and transform DB entity to response DTO
  async create(dto: CreateCartItemDto): Promise<ResponseCartItemDto> {
    const cartItem = await this.prisma.cartItem.create({
      data: {
        cartId: dto.cartId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
    return plainToInstance(ResponseCartItemDto, cartItem);
  }

  // Find all cart items; optionally filter by cartId
  async findAll(cartId?: number): Promise<ResponseCartItemDto[]> {
    const where = cartId ? { cartId } : {};
    const items = await this.prisma.cartItem.findMany({ where });
    const result: ResponseCartItemDto[] = items.map((item) =>
      plainToInstance(ResponseCartItemDto, item),
    );
    return result;
  }

  // Find a single cart item by primary key or throw 404
  async findOne(id: number): Promise<ResponseCartItemDto> {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('CartItem not found');
    return plainToInstance(ResponseCartItemDto, item);
  }

  // Update a cart item partially and return the transformed DTO
  async update(
    id: number,
    dto: UpdateCartItemDto,
  ): Promise<ResponseCartItemDto> {
    const item = await this.prisma.cartItem.update({
      where: { id },
      data: dto,
    });
    return plainToInstance(ResponseCartItemDto, item);
  }

  // Delete a cart item and return a simple success flag
  async remove(id: number): Promise<{ success: boolean }> {
    await this.prisma.cartItem.delete({ where: { id } });
    return { success: true };
  }
}
