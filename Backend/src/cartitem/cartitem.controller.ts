import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  NotFoundException,
  Logger,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CartItemService } from './cartitem.service';
import { CreateCartItemDto } from './dto/create.cartitem.dto';
import { UpdateCartItemDto } from './dto/update.cartitem.dto';
import { ResponseCartItemDto } from './dto/response.cartitem.dto';
import { AuthGuard } from '@nestjs/passport';

// Controller exposes REST endpoints for cart items with logging and errors
@UseGuards(AuthGuard('jwt'))
@Controller('cartitem')
export class CartItemController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly service: CartItemService) {}

  // POST /cartitems
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateCartItemDto): Promise<ResponseCartItemDto> {
    try {
      const item = await this.service.create(dto);
      Logger.log('Successfully created cart item');
      return item;
    } catch (error) {
      Logger.error(`Error creating cart item: ${error}`);
      throw new BadRequestException('Cannot create cart item');
    }
  }

  // GET /cartitems?cartId=123
  @Get()
  @HttpCode(200)
  async findAll(
    @Query('cartId') cartId?: string,
  ): Promise<ResponseCartItemDto[]> {
    try {
      const id = cartId ? parseInt(cartId, 10) : undefined;
      const items = await this.service.findAll(id);
      Logger.log('Successfully retrieved cart items');
      return items;
    } catch (error) {
      Logger.error(`Error retrieving cart items: ${error}`);
      throw new NotFoundException('No cart items found');
    }
  }

  // GET /cartitems/:id
  @Get(':id')
  @HttpCode(200)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseCartItemDto> {
    try {
      const item = await this.service.findOne(id);
      if (!item) throw new NotFoundException('CartItem not found');
      Logger.log('Successfully retrieved cart item');
      return item;
    } catch (error) {
      Logger.error(`Error retrieving cart item: ${error}`);
      throw new NotFoundException('CartItem not found');
    }
  }

  // PUT /cartitems/:id
  @Put(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<ResponseCartItemDto> {
    try {
      const item = await this.service.update(id, dto);
      Logger.log('Successfully updated cart item');
      return item;
    } catch (error) {
      Logger.error(`Error updating cart item: ${error}`);
      throw new BadRequestException('Cannot update cart item');
    }
  }

  // DELETE /cartitems/:id
  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.service.remove(id);
      Logger.log('Cart item successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting cart item: ${error}`);
      throw new BadRequestException('Cannot delete cart item');
    }
  }
}
