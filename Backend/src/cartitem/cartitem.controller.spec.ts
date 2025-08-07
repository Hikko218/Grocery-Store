/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CartItemController } from './cartitem.controller';
import { CartItemService } from './cartitem.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseCartItemDto } from './dto/response.cartitem.dto';

describe('CartItemController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cartId: number;
  let productId: string;
  let cartItemId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CartItemController],
      providers: [CartItemService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // Clean DB and create test cart and product
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    const product = await prisma.product.create({
      data: {
        productId: 'testprod',
        name: 'Test Product',
        price: 1.99,
      },
    });
    productId = product.productId;
    const cart = await prisma.cart.create({
      data: {
        user: {
          create: { email: `cart${Date.now()}@test.de`, password: 'pw' },
        },
      },
      include: { user: true },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should create, get, update, and delete a cart item', async () => {
    // Create
    const createRes = await request(app.getHttpServer())
      .post('/cartitem')
      .send({ cartId, productId, quantity: 2 })
      .expect(201);
    const createResBody = createRes.body as ResponseCartItemDto;
    expect(createResBody.cartId).toBe(cartId);
    expect(createResBody.productId).toBe(productId);
    expect(createResBody.quantity).toBe(2);
    cartItemId = createResBody.id;

    // Get all
    const getAllRes = await request(app.getHttpServer())
      .get(`/cartitem?cartId=${cartId}`)
      .expect(200);
    const getAllResBody = getAllRes.body as ResponseCartItemDto[];
    expect(Array.isArray(getAllResBody)).toBe(true);
    expect(getAllResBody.length).toBeGreaterThan(0);
    expect(getAllResBody[0].cartId).toBe(cartId);

    // Get one
    const getOneRes = await request(app.getHttpServer())
      .get(`/cartitem/${cartItemId}`)
      .expect(200);
    const getOneResBody = getOneRes.body as ResponseCartItemDto;
    expect(getOneResBody.id).toBe(cartItemId);
    expect(getOneResBody.cartId).toBe(cartId);

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/cartitem/${cartItemId}`)
      .send({ quantity: 5 })
      .expect(200);
    const updateResBody = updateRes.body as ResponseCartItemDto;
    expect(updateResBody.quantity).toBe(5);

    // Delete
    const deleteRes = await request(app.getHttpServer())
      .delete(`/cartitem/${cartItemId}`)
      .expect(200);
    const deleteResBody = deleteRes.body as { success: boolean };
    expect(deleteResBody.success).toBe(true);

    // Check if deleted
    const afterDeleteRes = await request(app.getHttpServer())
      .get(`/cartitem?cartId=${cartId}`)
      .expect(200);
    const afterDeleteResBody = afterDeleteRes.body as ResponseCartItemDto[];
    expect(afterDeleteResBody.find((i) => i.id === cartItemId)).toBeUndefined();
  });
});
