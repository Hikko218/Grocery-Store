import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { UpdateCartDto } from './dto/update.cart.dto';
import { ResponseCartDto } from './dto/response.cart.dto';
import { PrismaService } from '../prisma/prisma.service';

type AuthReq = Request & {
  user?: { id?: number; userId?: number; sub?: number };
};
function getUserId(req: AuthReq) {
  return Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);
}

// Controller for cart-related API endpoints
@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly cartService: CartService,
    // eslint-disable-next-line no-unused-vars
    private readonly prisma: PrismaService,
  ) {}

  // GET /cart?userId=1 - Get cart by userId
  @Get()
  @HttpCode(200)
  async getCart(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ResponseCartDto> {
    try {
      const cart = await this.cartService.findOneByUserId(userId);
      if (!cart) {
        throw new NotFoundException('No cart found for user');
      }
      Logger.log('Successfully retrieved cart');
      return cart;
    } catch (error) {
      Logger.error(`Error retrieving cart: ${error}`);
      throw new NotFoundException('No cart found for user');
    }
  }

  // POST /cart - Create a new cart
  @Post()
  @HttpCode(201)
  async createCart(@Body() dto: { userId: number }): Promise<ResponseCartDto> {
    try {
      const cart = await this.cartService.createCart(dto);
      Logger.log('Cart successfully created');
      return cart;
    } catch (error) {
      Logger.error(`Error creating cart: ${error}`);
      throw new BadRequestException('Cannot create cart');
    }
  }

  // POST /cart/:cartId/recalculate - Recalculate cart total
  @Post(':cartId/recalculate')
  @HttpCode(200)
  async recalculateTotal(
    @Param('cartId', ParseIntPipe) cartId: number,
  ): Promise<{ total: number }> {
    try {
      const total = await this.cartService.recalculateCartTotal(cartId);
      Logger.log(`Recalculated cart total: ${total}`);
      return { total };
    } catch (error) {
      Logger.error(`Error recalculating cart total: ${error}`);
      throw new BadRequestException('Cannot recalculate cart total');
    }
  }

  // PUT /cart/:cartId - Update cart
  @Put(':cartId')
  @HttpCode(200)
  async updateCart(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() data: UpdateCartDto,
  ): Promise<ResponseCartDto> {
    try {
      const cart = await this.cartService.updateCart(cartId, data);
      Logger.log('Successfully updated cart');
      // Do NOT recalculate total price here!
      return cart;
    } catch (error) {
      Logger.error(`Error updating cart: ${error}`);
      throw new BadRequestException('Cannot update cart');
    }
  }

  // DELETE /cart/:cartId - Delete cart
  @Delete(':cartId')
  @HttpCode(200)
  async deleteCart(
    @Param('cartId', ParseIntPipe) cartId: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.cartService.deleteCart(cartId);
      Logger.log('Cart successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting cart ${cartId}: ${error}`);
      throw new BadRequestException('Cannot delete cart');
    }
  }

  // POST /cart/clear - Clear all cart items for user
  @Post('clear')
  @HttpCode(200)
  async clear(@Req() req: AuthReq) {
    const userId = getUserId(req);
    if (!Number.isFinite(userId)) return { cleared: false };
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { cleared: true };
  }
}
