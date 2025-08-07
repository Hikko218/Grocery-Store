/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ResponseOrderDto } from './dto/response.order.dto';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let orderId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [OrderService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up and create test user
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    const user = await prisma.user.create({
      data: { email: `order${Date.now()}@test.de`, password: 'pw' },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, get, update, and delete an order', async () => {
    // Create
    const createRes = await request(app.getHttpServer())
      .post('/order')
      .send({ userId, totalPrice: 100 })
      .expect(201);
    const createResBody = createRes.body as ResponseOrderDto;
    expect(createResBody).toBeDefined();
    expect(createResBody.userId).toBe(userId);
    expect(createResBody.totalPrice).toBe(100);
    orderId = createResBody.id;

    // Get
    const getRes = await request(app.getHttpServer())
      .get(`/order?userId=${userId}`)
      .expect(200);
    const getResBody = getRes.body as ResponseOrderDto[];
    expect(Array.isArray(getResBody)).toBe(true);
    expect(getResBody.length).toBeGreaterThan(0);
    expect(getResBody[0].userId).toBe(userId);

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .send({ totalPrice: 200 })
      .expect(200);
    const updateResBody = updateRes.body as ResponseOrderDto;
    expect(updateResBody.totalPrice).toBe(200);

    // Delete
    const deleteRes = await request(app.getHttpServer())
      .delete(`/order/${orderId}`)
      .expect(200);
    const deleteResBody = deleteRes.body as { success: boolean };
    expect(deleteResBody.success).toBe(true);

    // Check if deleted
    const afterDeleteRes = await request(app.getHttpServer())
      .get(`/order?userId=${userId}`)
      .expect(200);
    const afterDeleteResBody = afterDeleteRes.body as ResponseOrderDto[];
    expect(afterDeleteResBody.find((o) => o.id === orderId)).toBeUndefined();
  });
});
