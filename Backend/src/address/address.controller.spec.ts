/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressType } from '@prisma/client';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

type ResponseAddress = {
  id: number;
  userId: number;
  type: 'SHIPPING' | 'BILLING';
  isDefault: boolean;
  name: string | null;
  street: string;
  street2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  createdAt: string;
};

// End-to-end tests for AddressController API endpoints
describe('AddressController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userId: number;
  let userEmail: string;
  let userCookie: string;
  let addressId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean DB
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});

    // Create user
    userEmail = `address${Date.now()}@test.de`;
    const hashedPw = await bcrypt.hash('pw', 10);
    const user = await prisma.user.create({
      data: { email: userEmail, password: hashedPw },
    });
    userId = user.id;

    // Login -> combine all cookies (Authentication + Refresh)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'pw' });

    userCookie = loginRes.headers['set-cookie']?.[0];
  });

  afterAll(async () => {
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('GET /address returns 200 and empty array', async () => {
    const res = await request(app.getHttpServer())
      .get('/address')
      .set('Cookie', userCookie)
      .expect(200);

    const body = res.body as unknown as ResponseAddress[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it('POST /address creates and returns 201', async () => {
    const payload = {
      type: AddressType.SHIPPING,
      isDefault: true,
      street: 'Musterstraße 1',
      postalCode: '12345',
      city: 'Musterstadt',
      country: 'DE',
    };
    const res = await request(app.getHttpServer())
      .post('/address')
      .set('Cookie', userCookie)
      .send(payload)
      .expect(201);

    const body = res.body as unknown as ResponseAddress;
    expect(body).toHaveProperty('id');
    expect(body).toMatchObject({
      userId,
      type: 'SHIPPING',
      isDefault: true,
      street: payload.street,
      city: payload.city,
      country: payload.country,
    });
    addressId = body.id;
  });

  it('GET /address returns created address', async () => {
    const res = await request(app.getHttpServer())
      .get('/address')
      .set('Cookie', userCookie)
      .expect(200);

    const body = res.body as unknown as ResponseAddress[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0]).toHaveProperty('id', addressId);
  });

  it('PATCH /address/:id updates and returns 200', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/address/${addressId}`)
      .set('Cookie', userCookie)
      .send({ name: 'Zuhause' })
      .expect(200);

    const body = res.body as unknown as ResponseAddress;
    expect(body).toHaveProperty('id', addressId);
    expect(body).toHaveProperty('name', 'Zuhause');
  });

  it('DELETE /address/:id returns success', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/address/${addressId}`)
      .set('Cookie', userCookie)
      .expect(200);

    const body = res.body as unknown as { success: boolean };
    expect(body).toEqual({ success: true });
  });
});
