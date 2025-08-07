/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseCartDto } from './dto/response.cart.dto';

describe('CartController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let cartId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [CartService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // Clean DB and create test user and cart
    await prisma.cart.deleteMany({});
    await prisma.user.deleteMany({});
    const user = await prisma.user.create({
      data: { email: `cart${Date.now()}@test.de`, password: 'pw' },
    });
    userId = user.id;
    const cart = await prisma.cart.create({
      data: { userId },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.cart.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should create, get, update, and delete a cart', async () => {
    // Get cart by userId
    const getRes = await request(app.getHttpServer())
      .get(`/cart?userId=${userId}`)
      .expect(200);
    const getResBody = getRes.body as ResponseCartDto;
    expect(getResBody.userId).toBe(userId);
    expect(getResBody.id).toBe(cartId);

    // Create (should fail, only one cart per user)
    await request(app.getHttpServer())
      .post('/cart')
      .send({ userId })
      .expect(400);

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/cart/${cartId}`)
      .send({ userId })
      .expect(200);
    const updateResBody = updateRes.body as ResponseCartDto;
    expect(updateResBody.userId).toBe(userId);
    expect(updateResBody.id).toBe(cartId);

    // Delete
    const deleteRes = await request(app.getHttpServer())
      .delete(`/cart/${cartId}`)
      .expect(200);
    const deleteResBody = deleteRes.body as { success: boolean };
    expect(deleteResBody.success).toBe(true);

    // Check if deleted
    await request(app.getHttpServer())
      .get(`/cart?userId=${userId}`)
      .expect(404);
  });
});
