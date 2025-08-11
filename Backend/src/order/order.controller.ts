import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create.order.dto';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';

@Controller('order')
export class OrderController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly orderService: OrderService) {}

  // POST /order
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateOrderDto): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.create(dto);
      Logger.log(`Created order ${order.id} for user ${order.userId}`);
      return order;
    } catch (err) {
      Logger.error(
        `Error creating order`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant create order');
    }
  }

  // GET /order?userId=123
  @Get()
  @HttpCode(200)
  async find(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ResponseOrderDto[]> {
    try {
      const orders = await this.orderService.findByUser(userId);
      Logger.log(`Fetched ${orders.length} orders for user ${userId}`);
      return orders;
    } catch (err) {
      Logger.error(
        `Error fetching orders for user ${userId}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new NotFoundException('Cant get orders');
    }
  }

  // PUT /order/:orderId
  @Put(':orderId')
  @HttpCode(200)
  async update(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderDto,
  ): Promise<ResponseOrderDto> {
    try {
      const order = await this.orderService.update(orderId, dto);
      Logger.log(`Updated order ${orderId}`);
      return order;
    } catch (err) {
      Logger.error(
        `Error updating order ${orderId}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant update order');
    }
  }

  // DELETE /order/:orderId
  @Delete(':orderId')
  @HttpCode(200)
  async remove(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<{ success: boolean }> {
    try {
      const res = await this.orderService.delete(orderId);
      Logger.log(`Deleted order ${orderId}`);
      return res;
    } catch (err) {
      Logger.error(
        `Error deleting order ${orderId}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant delete order');
    }
  }
}
