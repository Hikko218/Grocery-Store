import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseOrderDto } from './dto/response.order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: PrismaService;
  let userId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderService, PrismaService],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean up and create test user
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    const user = await prisma.user.create({
      data: { email: `order${Date.now()}@test.de`, password: 'pw' },
    });
    userId = user.id;

    // Create a cart for the user with totalPrice 100
    await prisma.cart.create({
      data: {
        userId,
        totalPrice: 100,
      },
    });
  });

  it('should create an order', async () => {
    const order: ResponseOrderDto = await service.createOrder(userId);
    expect(order.id).toBeDefined();
    expect(order.userId).toBe(userId);
    expect(order.totalPrice).toBeGreaterThanOrEqual(0);
  });

  it('should list orders', async () => {
    const orders: ResponseOrderDto[] = await service.getOrders(userId);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].userId).toBe(userId);
  });

  it('should update order', async () => {
    const created: ResponseOrderDto = await service.createOrder(userId);
    const updated: ResponseOrderDto = await service.updateOrder(created.id, {
      totalPrice: 200,
    });
    expect(updated.totalPrice).toBe(200);
  });

  it('should delete order', async () => {
    const created: ResponseOrderDto = await service.createOrder(userId);
    await service.deleteOrder(created.id);
    const afterDelete: ResponseOrderDto[] = await service.getOrders(userId);
    expect(afterDelete.find((o) => o.id === created.id)).toBeUndefined();
  });
});
