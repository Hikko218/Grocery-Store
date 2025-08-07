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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create.order.dto';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';

@Controller('order')
export class OrderController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly orderService: OrderService) {}

  // GET /order?userId=1
  @Get()
  @HttpCode(200)
  async getOrders(
    @Query('userId') userId: number,
  ): Promise<ResponseOrderDto[]> {
    try {
      const orders = await this.orderService.getOrders(Number(userId));
      if (!orders) {
        throw new NotFoundException('No orders found');
      }
      Logger.log('Successfully retrieved orders');
      return orders;
    } catch (error) {
      Logger.error(`Error retrieving orders: ${error}`);
      throw new NotFoundException('No orders found');
    }
  }

  // POST /order
  @Post()
  @HttpCode(201)
  async createOrder(@Body() data: CreateOrderDto): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.createOrder(data);
      Logger.log('Successfully created order');
      return order;
    } catch (error) {
      Logger.error(`Error creating order: ${error}`);
      throw new BadRequestException('Cannot create order');
    }
  }

  // PUT /order/:orderId
  @Put(':orderId')
  @HttpCode(200)
  async updateOrder(
    @Param('orderId') orderId: number,
    @Body() data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.updateOrder(Number(orderId), data);
      Logger.log('Successfully updated order');
      return order;
    } catch (error) {
      Logger.error(`Error updating order: ${error}`);
      throw new BadRequestException('Cannot update order');
    }
  }

  // DELETE /order/:orderId
  @Delete(':orderId')
  @HttpCode(200)
  async deleteOrder(
    @Param('orderId') orderId: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.orderService.deleteOrder(Number(orderId));
      Logger.log('Order successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting order ${orderId}: ${error}`);
      throw new BadRequestException('Cannot delete order');
    }
  }
}
