import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: PrismaService;
  let userId: number;
  let orderId: number;

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

  it('should create, get, update, and delete an order', async () => {
    // Create
    const order = await service.createOrder(userId);
    orderId = order.id;
    expect(order).toBeDefined();
    expect(order.userId).toBe(userId);
    expect(order.totalPrice).toBe(100);

    // Get
    const orders = await service.getOrders(userId);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].userId).toBe(userId);

    // Update
    const updated = await service.updateOrder(orderId, { totalPrice: 200 });
    expect(updated.totalPrice).toBe(200);

    // Delete
    await service.deleteOrder(orderId);
    // Check if deleted
    const afterDelete = await service.getOrders(userId);
    expect(afterDelete.find((o) => o.id === orderId)).toBeUndefined();
  });
});
