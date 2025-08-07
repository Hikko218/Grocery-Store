import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create.cart.dto';
import { UpdateCartDto } from './dto/update.cart.dto';
import { ResponseCartDto } from './dto/response.cart.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CartService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  async createCart(dto: CreateCartDto): Promise<ResponseCartDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: Number(dto.userId) },
    });
    if (cart) {
      // If a cart already exists for this user, throw BadRequestException
      throw new (await import('@nestjs/common')).BadRequestException(
        'Cart for this user already exists',
      );
    }
    const newCart = await this.prisma.cart.create({
      data: {
        userId: dto.userId,
      },
    });
    return plainToInstance(ResponseCartDto, newCart);
  }

  async findOneByUserId(userId: number): Promise<ResponseCartDto | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: Number(userId) },
    });
    if (!cart) return null;
    return plainToInstance(ResponseCartDto, cart);
  }

  async updateCart(id: number, dto: UpdateCartDto): Promise<ResponseCartDto> {
    const cart = await this.prisma.cart.update({
      where: { id },
      data: dto,
    });
    return plainToInstance(ResponseCartDto, cart);
  }

  async deleteCart(id: number): Promise<{ success: boolean }> {
    await this.prisma.cart.delete({ where: { id } });
    return { success: true };
  }
}
