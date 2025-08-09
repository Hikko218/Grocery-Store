/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CartItemController } from './cartitem.controller';
import { CartItemService } from './cartitem.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseCartItemDto } from './dto/response.cartitem.dto';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';

describe('CartItemController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cartId: number;
  let productId: string;
  let cartItemId: number;
  let userId: number;
  let userEmail: string;
  let userCookie: string;

  beforeAll(async () => {
    // Setup NestJS test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [CartItemController],
      providers: [CartItemService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);

    // Clean DB and create test cart and product
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `cart${Date.now()}@test.de`;
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

    // Create test product
    const product = await prisma.product.create({
      data: {
        productId: 'testprod',
        name: 'Test Product',
        price: 1.99,
      },
    });
    productId = product.productId;

    // Create cart for user
    const cart = await prisma.cart.create({
      data: {
        userId,
        totalPrice: 0,
      },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    // Clean up DB and close app after tests
    await app.close();
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should create, get, update, and delete a cart item', async () => {
    // Create cart item
    const createRes = await request(app.getHttpServer())
      .post('/cartitem')
      .set('Cookie', userCookie)
      .send({ cartId, productId, quantity: 2 })
      .expect(201);
    const createResBody = createRes.body as ResponseCartItemDto;
    expect(createResBody.cartId).toBe(cartId);
    expect(createResBody.productId).toBe(productId);
    expect(createResBody.quantity).toBe(2);
    cartItemId = createResBody.id;

    // Get all cart items
    const getAllRes = await request(app.getHttpServer())
      .get(`/cartitem?cartId=${cartId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const getAllResBody = getAllRes.body as ResponseCartItemDto[];
    expect(Array.isArray(getAllResBody)).toBe(true);
    expect(getAllResBody.length).toBeGreaterThan(0);
    expect(getAllResBody[0].cartId).toBe(cartId);

    // Get single cart item
    const getOneRes = await request(app.getHttpServer())
      .get(`/cartitem/${cartItemId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const getOneResBody = getOneRes.body as ResponseCartItemDto;
    expect(getOneResBody.id).toBe(cartItemId);
    expect(getOneResBody.cartId).toBe(cartId);

    // Update cart item
    const updateRes = await request(app.getHttpServer())
      .put(`/cartitem/${cartItemId}`)
      .set('Cookie', userCookie)
      .send({ quantity: 5 })
      .expect(200);
    const updateResBody = updateRes.body as ResponseCartItemDto;
    expect(updateResBody.quantity).toBe(5);

    // Delete cart item
    const deleteRes = await request(app.getHttpServer())
      .delete(`/cartitem/${cartItemId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const deleteResBody = deleteRes.body as { success: boolean };
    expect(deleteResBody.success).toBe(true);

    // Check if deleted
    const afterDeleteRes = await request(app.getHttpServer())
      .get(`/cartitem?cartId=${cartId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const afterDeleteResBody = afterDeleteRes.body as ResponseCartItemDto[];
    expect(afterDeleteResBody.find((i) => i.id === cartItemId)).toBeUndefined();
  });
});
