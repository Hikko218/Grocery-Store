import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  Logger,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('order')
export class OrderController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly orderService: OrderService) {}

  // GET /order?userId=1
  @Get()
  @HttpCode(200)
  async getOrders(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ResponseOrderDto[]> {
    try {
      const orders = await this.orderService.getOrders(userId);
      Logger.log('Successfully retrieved orders');
      return orders;
    } catch (error) {
      Logger.error(`Error retrieving orders: ${error}`);
      throw new NotFoundException('No orders found for user');
    }
  }

  // POST /order
  @Post()
  @HttpCode(201)
  async createOrder(
    @Body() body: { userId: number },
  ): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.createOrder(body.userId);
      Logger.log('Successfully created order');
      return order;
    } catch (error) {
      Logger.error(`Error creating order: ${error}`);
      throw new BadRequestException('Cannot create order');
    }
  }

  // PUT /order/:orderId
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Put(':orderId')
  @HttpCode(200)
  async updateOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() data: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.updateOrder(orderId, data);
      Logger.log('Successfully updated order');
      return order;
    } catch (error) {
      Logger.error(`Error updating order: ${error}`);
      throw new BadRequestException('Cannot update order');
    }
  }

  // DELETE /order/:orderId
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':orderId')
  @HttpCode(200)
  async deleteOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.orderService.deleteOrder(orderId);
      Logger.log('Order successfully deleted');
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting order: ${error}`);
      throw new BadRequestException('Cannot delete order');
    }
  }
}
