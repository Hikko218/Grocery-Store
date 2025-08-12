/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseCartDto } from './dto/response.cart.dto';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';

// End-to-end tests for CartController API endpoints
describe('CartController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let cartId: number;
  let userEmail: string;
  let userCookie: string;

  beforeAll(async () => {
    // Setup NestJS test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [CartController],
      providers: [CartService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up carts and users before tests
    await prisma.cart.deleteMany({});
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

    // Create cart for user
    const cart = await prisma.cart.create({
      data: { userId, totalPrice: 0 },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    // Clean up carts and users after tests and close app
    await prisma.cart.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('/cart (GET) should get cart by userId', async () => {
    // Test get cart by userId endpoint
    const res = await request(app.getHttpServer())
      .get('/cart')
      .set('Cookie', userCookie)
      .query({ userId })
      .expect(200);
    const cart = res.body as ResponseCartDto;
    expect(cart).toHaveProperty('id');
    expect(cart.userId).toBe(userId);
  });

  it('/cart/:cartId (PUT) should update cart and recalculate total', async () => {
    // Test update cart endpoint
    const res = await request(app.getHttpServer())
      .put(`/cart/${cartId}`)
      .set('Cookie', userCookie)
      .send({ totalPrice: 99.99 })
      .expect(200);
    const cart = res.body as ResponseCartDto;
    expect(cart.totalPrice).toBe(99.99);
  });

  it('/cart/:cartId/recalculate (POST) should recalculate total price', async () => {
    // Test recalculate total endpoint
    const res = await request(app.getHttpServer())
      .post(`/cart/${cartId}/recalculate`)
      .set('Cookie', userCookie)
      .expect(200);
    const result = res.body as { total: number };
    expect(result).toHaveProperty('total');
    expect(typeof result.total).toBe('number');
  });

  it('/cart/:cartId (DELETE) should delete cart', async () => {
    // Test delete cart endpoint
    const res = await request(app.getHttpServer())
      .delete(`/cart/${cartId}`)
      .set('Cookie', userCookie)
      .expect(200);
    expect(res.body).toEqual({ success: true });
  });
});
