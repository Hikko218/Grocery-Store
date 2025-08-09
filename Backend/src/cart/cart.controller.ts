import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  Logger,
  BadRequestException,
  NotFoundException,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartDto } from './dto/update.cart.dto';
import { ResponseCartDto } from './dto/response.cart.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly cartService: CartService) {}

  // GET /cart?userId=1
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

  // POST /cart
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

  // POST /cart/:cartId/recalculate
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

  // PUT /cart/:cartId
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

  // DELETE /cart/:cartId
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
}
