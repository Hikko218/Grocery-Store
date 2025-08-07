/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('OrderItemController', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orderId: number;
  let orderItemId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    const order = await prisma.order.create({
      data: {
        user: { create: { email: 'testorderitem@test.de', password: 'pw' } },
        totalPrice: 10,
      },
    });
    orderId = order.id;
  });

  it('/orderitems (POST) should create order item', async () => {
    const data = {
      order: { connect: { id: orderId } },
      product: { create: { productId: 'p2', name: 'OrderItemTest', price: 1 } },
      quantity: 2,
      price: 2,
    };
    const res = await request(app.getHttpServer())
      .post('/orderitems')
      .send(data);
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    const body = res.body as unknown as { id: number; orderId: number };
    orderItemId = body.id;
    expect(body.orderId).toBe(orderId);
  });

  it('/orderitems/:orderId (GET) should return order items', async () => {
    const res = await request(app.getHttpServer()).get(
      `/orderitems/${orderId}`,
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const items = res.body as unknown as Array<{ id: number }>;
    expect(items.some((item) => item.id === orderItemId)).toBe(true);
  });

  it('/orderitems/:orderItemId (PUT) should update order item', async () => {
    const data = { quantity: 5 };
    const res = await request(app.getHttpServer())
      .put(`/orderitems/${orderItemId}`)
      .send(data);
    expect(res.status).toBe(200);
    const body = res.body as unknown as { quantity: number };
    expect(body.quantity).toBe(5);
  });

  it('/orderitems/:orderItemId (DELETE) should delete order item', async () => {
    const res = await request(app.getHttpServer()).delete(
      `/orderitems/${orderItemId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    // Check that item is deleted
    const getRes = await request(app.getHttpServer()).get(
      `/orderitems/${orderId}`,
    );
    expect(getRes.status).toBe(200);
    const items = getRes.body as unknown as Array<{ id: number }>;
    expect(items.some((item) => item.id === orderItemId)).toBe(false);
  });

  afterAll(async () => {
    await app.close();
  });
});
