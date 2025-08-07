import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemService } from './orderitem.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrderItemService', () => {
  let service: OrderItemService;
  let prisma: PrismaService;
  let orderId: number;
  let orderItemId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderItemService, PrismaService],
    }).compile();

    service = module.get<OrderItemService>(OrderItemService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean up and create test order
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    const uniqueEmail = `test${Date.now()}@test.de`;
    const order = await prisma.order.create({
      data: {
        user: { create: { email: uniqueEmail, password: 'pw' } },
        totalPrice: 10,
      },
    });
    orderId = order.id;

    // Produkt für den Test anlegen
    await prisma.product.create({
      data: { productId: 'p1', name: 'Testprodukt', price: 1 },
    });
  });

  it('should create, get, update, and delete an order item', async () => {
    // Create
    const item = await service.createOrderItem({
      orderId: orderId,
      productId: 'p1',
      quantity: 2,
      price: 2,
    });
    orderItemId = item.id;
    expect(item).toBeDefined();
    expect(item.orderId).toBe(orderId);

    // Get
    const items = await service.getOrderItems(orderId);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    // Update
    const updated = await service.updateOrderItem(orderItemId, { quantity: 5 });
    expect(updated.quantity).toBe(5);

    // Delete
    await service.deleteOrderItem(orderItemId);
    const afterDelete = await service.getOrderItems(orderId);
    expect(afterDelete.find((i) => i.id === orderItemId)).toBeUndefined();
  });
});
