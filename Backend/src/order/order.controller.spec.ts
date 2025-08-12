/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ResponseOrderDto } from './dto/response.order.dto';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

// End-to-end tests for OrderController API endpoints
describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let orderId: number;
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [OrderController],
      providers: [OrderService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up and create test user
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.cart.deleteMany({});

    const hashedPw = await bcrypt.hash('pw', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: `admin${Date.now()}@test.de`,
        password: hashedPw,
        role: 'admin',
      },
    });

    // Admin login to get cookie
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password: 'pw' });
    adminCookie = loginRes.headers['set-cookie']?.[0];

    expect(adminCookie).toBeDefined();

    const userHashedPw = await bcrypt.hash('pw', 10);

    const user = await prisma.user.create({
      data: { email: `order${Date.now()}@test.de`, password: userHashedPw },
    });
    userId = user.id;

    // User-Login für /order/me
    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'pw' });
    userCookie = userLoginRes.headers['set-cookie']?.[0];
    expect(userCookie).toBeDefined();

    // Create a cart for the user with totalPrice 100
    await prisma.cart.create({
      data: {
        userId,
        totalPrice: 100,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, get, update, and delete an order', async () => {
    // Create (jetzt mit Shipping-Feldern)
    const createRes = await request(app.getHttpServer())
      .post('/order')
      .set('Cookie', adminCookie)
      .send({
        userId,
        shippingName: 'Max Mustermann',
        shippingStreet: 'Musterstr. 1',
        shippingPostalCode: '12345',
        shippingCity: 'Musterstadt',
        shippingCountry: 'DE',
        // optional:
        shippingStreet2: 'c/o',
        shippingPhone: '+49123456789',
      })
      .expect(201);
    const createResBody = createRes.body as ResponseOrderDto;
    expect(createResBody).toBeDefined();
    expect(createResBody.userId).toBe(userId);
    expect(createResBody.totalPrice).toBe(100);
    orderId = createResBody.id;

    // Get
    const getRes = await request(app.getHttpServer())
      .get('/order/me')
      .set('Cookie', userCookie)
      .expect(200);
    const getResBody = getRes.body as ResponseOrderDto[];
    expect(Array.isArray(getResBody)).toBe(true);
    expect(getResBody.length).toBeGreaterThan(0);
    // Controller-DTO enthält keine userId: Form/Struktur prüfen
    expect(typeof getResBody[0].id).toBe('number');
    expect(getResBody[0]).toHaveProperty('items');

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Cookie', adminCookie)
      .send({ totalPrice: 200, shippingCity: 'Neu-Stadt' })
      .expect(200);
    const updateResBody = updateRes.body as ResponseOrderDto;
    expect(updateResBody.totalPrice).toBe(200);
    expect(updateResBody.shippingCity).toBe('Neu-Stadt');

    // Delete
    const deleteRes = await request(app.getHttpServer())
      .delete(`/order/${orderId}`)
      .set('Cookie', adminCookie)
      .expect(200);
    const deleteResBody = deleteRes.body as { success: boolean };
    expect(deleteResBody.success).toBe(true);

    // Check if deleted
    const afterDeleteRes = await request(app.getHttpServer())
      .get('/order/me')
      .set('Cookie', userCookie)
      .expect(200);
    const afterDeleteResBody = afterDeleteRes.body as ResponseOrderDto[];
    expect(afterDeleteResBody.find((o) => o.id === orderId)).toBeUndefined();
  });
});
