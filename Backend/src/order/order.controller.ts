import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  BadRequestException,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create.order.dto';
import { UpdateOrderDto } from './dto/update.order.dto';
import { ResponseOrderDto } from './dto/response.order.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type AuthReq = Request & {
  user?: { id?: number; userId?: number; sub?: number };
};
function getUserId(req: AuthReq) {
  return Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);
}

// Controller for order-related API endpoints
@UseGuards(AuthGuard('jwt'))
@Controller('order')
export class OrderController {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly orderService: OrderService,
    // eslint-disable-next-line no-unused-vars
    private readonly prisma: PrismaService,
  ) {}

  // POST /order - Create a new order
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

  // GET /order/me - Get orders for authenticated user
  @Get('me')
  @HttpCode(200)
  async listMy(@Req() req: AuthReq) {
    const userId = getUserId(req);
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map auf ein kompaktes DTO mit status + Produktinfos
    return orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.paymentStatus, // vereinheitlicht
      totalPrice: o.totalPrice,
      items: o.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        price: it.price,
        product: it.product,
      })),
    }));
  }

  // PUT /order/:orderId - Update an order
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

  // DELETE /order/:orderId - Delete an order
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
