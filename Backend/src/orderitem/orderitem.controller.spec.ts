/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

// End-to-end tests for OrderItemController API endpoints
describe('OrderItemController', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orderId: number;
  let orderItemId: number;
  let userId: number;
  let userEmail: string;
  let userCookie: string;

  beforeAll(async () => {
    // Setup NestJS test application
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `testorderitem${Date.now()}@test.de`;
    const hashedPw = await bcrypt.hash('pw', 10);
    const user = await prisma.user.create({
      data: { email: userEmail, password: hashedPw },
    });
    userId = user.id;

    // Login to get authentication cookie
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'pw' });
    userCookie = loginRes.headers['set-cookie']?.[0];

    // Create order for user
    const order = await prisma.order.create({
      data: {
        userId, // bestehender User
        totalPrice: 0,
        shippingName: 'Test User',
        shippingStreet: 'Teststraße 1',
        shippingPostalCode: '12345',
        shippingCity: 'Berlin',
        shippingCountry: 'DE',
        // optional:
        shippingStreet2: '1. OG',
        shippingPhone: '+49123456789',
      },
    });
    orderId = order.id;
  });

  it('/orderitem (POST) should create order item', async () => {
    // Test create order item endpoint
    const data = {
      order: { connect: { id: orderId } },
      product: { create: { productId: 'p2', name: 'OrderItemTest', price: 1 } },
      quantity: 2,
      price: 2,
    };
    const res = await request(app.getHttpServer())
      .post('/orderitem')
      .set('Cookie', userCookie)
      .send(data);
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    const body = res.body as { id: number; orderId: number };
    orderItemId = body.id;
    expect(body.orderId).toBe(orderId);
  });

  it('/orderitems/:orderId (GET) should return order items', async () => {
    // Test get order items by orderId endpoint
    const res = await request(app.getHttpServer())
      .get(`/orderitem/${orderId}`)
      .set('Cookie', userCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const items = res.body as Array<{ id: number }>;
    expect(items.some((item) => item.id === orderItemId)).toBe(true);
  });

  it('/orderitem/:orderItemId (PUT) should update order item', async () => {
    // Test update order item endpoint
    const data = { quantity: 5 };
    const res = await request(app.getHttpServer())
      .put(`/orderitem/${orderItemId}`)
      .set('Cookie', userCookie)
      .send(data);
    expect(res.status).toBe(200);
    const body = res.body as { quantity: number };
    expect(body.quantity).toBe(5);
  });

  it('/orderitem/:orderItemId (DELETE) should delete order item', async () => {
    // Test delete order item endpoint
    const res = await request(app.getHttpServer())
      .delete(`/orderitem/${orderItemId}`)
      .set('Cookie', userCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    // Check that item is deleted
    const getRes = await request(app.getHttpServer())
      .get(`/orderitem/${orderId}`)
      .set('Cookie', userCookie);
    expect(getRes.status).toBe(200);
    const items = getRes.body as Array<{ id: number }>;
    expect(items.some((item) => item.id === orderItemId)).toBe(false);
  });

  afterAll(async () => {
    // Close NestJS app after tests
    await app.close();
  });
});
