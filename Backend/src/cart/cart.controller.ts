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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create.cart.dto';
import { UpdateCartDto } from './dto/update.cart.dto';
import { ResponseCartDto } from './dto/response.cart.dto';

@Controller('cart')
export class CartController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly cartService: CartService) {}

  // GET /cart?userId=1
  @Get()
  @HttpCode(200)
  async getCart(@Query('userId') userId: number): Promise<ResponseCartDto> {
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
  async createCart(@Body() data: CreateCartDto): Promise<ResponseCartDto> {
    try {
      const cart = await this.cartService.createCart(data);
      Logger.log('Successfully created cart');
      return cart;
    } catch (error) {
      Logger.error(`Error creating cart: ${error}`);
      throw new BadRequestException('Cannot create cart');
    }
  }

  // PUT /cart/:cartId
  @Put(':cartId')
  @HttpCode(200)
  async updateCart(
    @Param('cartId') cartId: number,
    @Body() data: UpdateCartDto,
  ): Promise<ResponseCartDto> {
    try {
      const cart = await this.cartService.updateCart(Number(cartId), data);
      Logger.log('Successfully updated cart');
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
    @Param('cartId') cartId: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.cartService.deleteCart(Number(cartId));
      Logger.log('Cart successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting cart ${cartId}: ${error}`);
      throw new BadRequestException('Cannot delete cart');
    }
  }
}
