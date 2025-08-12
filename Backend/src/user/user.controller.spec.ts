/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let userEmail: string;
  let userCookie: string;

  beforeAll(async () => {
    // Setup NestJS test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up users before tests
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `test${Date.now()}@example.com`;
    const hashedPw = await bcrypt.hash('secret', 10);
    const user = await prisma.user.create({
      data: { email: userEmail, password: hashedPw },
    });
    userId = user.id;

    // Login to get authentication cookie
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'secret' });

    userCookie = loginRes.headers['set-cookie']?.[0];
  });

  afterAll(async () => {
    // Close NestJS app after tests
    await app.close();
  });

  // Response type for user endpoints
  interface UserResponse {
    id: number;
    email: string;
    password?: string;
    createdAt?: string;
    role?: string;
  }

  // Response type for delete endpoint
  interface DeleteResponse {
    success: boolean;
  }

  it('should create a user', async () => {
    const email = `new${Date.now()}@example.com`;
    // Test user creation endpoint
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({ email, password: 'pw' })
      .expect(201);
    const body = res.body as UserResponse;
    expect(body.email).toBe(email);
  });

  it('should get user by email', async () => {
    // Test get user by email endpoint
    const res = await request(app.getHttpServer())
      .get(`/user/${userEmail}`)
      .set('Cookie', userCookie)
      .expect(200);
    const body = res.body as UserResponse;
    expect(body.email).toBe(userEmail);
  });

  it('should get user by id', async () => {
    // Test get user by id endpoint
    const res = await request(app.getHttpServer())
      .get(`/user/id/${userId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const body = res.body as UserResponse;
    expect(body.id).toBe(userId);
  });

  it('should update user', async () => {
    // Test update user endpoint
    const res = await request(app.getHttpServer())
      .put(`/user/${userId}`)
      .set('Cookie', userCookie)
      .send({ email: 'updated@test.de' })
      .expect(200);
    const body = res.body as UserResponse;
    expect(body.email).toBe('updated@test.de');
  });

  it('should delete user', async () => {
    // Test delete user endpoint
    const res = await request(app.getHttpServer())
      .delete(`/user/${userId}`)
      .set('Cookie', userCookie)
      .expect(200);
    const body = res.body as DeleteResponse;
    expect(body.success).toBe(true);
  });
});
