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
  UseGuards,
} from '@nestjs/common';
import { OrderItemService } from './orderitem.service';
import { CreateOrderItemDto } from './dto/create.orderitem.dto';
import { UpdateOrderItemDto } from './dto/update.orderitem.dto';
import { ResponseOrderItemDto } from './dto/response.orderitem.dto';
import { AuthGuard } from '@nestjs/passport';

// Controller for order item-related API endpoints
@UseGuards(AuthGuard('jwt'))
@Controller('orderitem')
export class OrderItemController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly orderItemService: OrderItemService) {}

  // GET /orderitems/:orderId - Get all order items for an order
  @Get(':orderId')
  @HttpCode(200)
  async getOrderItems(
    @Param('orderId') orderId: number,
  ): Promise<ResponseOrderItemDto[]> {
    try {
      const items = await this.orderItemService.getOrderItems(Number(orderId));
      if (!items) {
        throw new NotFoundException('Cant get order items');
      }
      Logger.log('Successfully received order items');
      return items;
    } catch (error) {
      Logger.error(`Error retrieving order items: ${error}`);
      throw new NotFoundException('Cant get order items');
    }
  }

  // POST /orderitems - Create a new order item
  @Post()
  @HttpCode(201)
  async createOrderItem(
    @Body() data: CreateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    try {
      const item = await this.orderItemService.createOrderItem(data);
      Logger.log('Successfully created order item');
      return item;
    } catch (error) {
      Logger.error(`Error creating order item: ${error}`);
      throw new BadRequestException('Cant create order item');
    }
  }

  // PUT /orderitems/:orderItemId - Update an order item
  @Put(':orderItemId')
  @HttpCode(200)
  async updateOrderItem(
    @Param('orderItemId') orderItemId: number,
    @Body() data: UpdateOrderItemDto,
  ): Promise<ResponseOrderItemDto> {
    try {
      const item = await this.orderItemService.updateOrderItem(
        Number(orderItemId),
        data,
      );
      Logger.log('Successfully updated order item');
      return item;
    } catch (error) {
      Logger.error(`Error updating order item: ${error}`);
      throw new BadRequestException('Cant update order item');
    }
  }

  // DELETE /orderitems/:orderItemId - Delete an order item
  @Delete(':orderItemId')
  @HttpCode(200)
  async deleteOrderItem(
    @Param('orderItemId') orderItemId: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.orderItemService.deleteOrderItem(Number(orderItemId));
      Logger.log('Order item successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting order item ${orderItemId}: ${error}`);
      throw new BadRequestException('Cant delete order item');
    }
  }
}
