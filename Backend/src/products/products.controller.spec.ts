/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PrismaService } from '../prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { AuthModule } from '../auth/auth.module';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

describe('ProductsController', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productId: string;
  let adminCookie: string;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

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

    // create product for tests
    const product = await prisma.product.create({
      data: {
        productId: 'test-product-1',
        name: 'Test Product',
        brand: 'Test Brand',
        category: 'Test Category',
        price: 1.99,
        imageUrl: 'test.jpg',
      },
    });
    productId = product.productId;
  });

  // Create Product
  it('/products (POST) should create product', async () => {
    const data = {
      productId: 'test-product-2',
      name: 'Test Product 2',
      brand: 'Brand 2',
      category: 'Category 2',
      price: 2.99,
      imageUrl: 'test2.jpg',
    };
    const res = await request(app.getHttpServer())
      .post(`/products`)
      .set('Cookie', adminCookie)
      .send(data);
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    const createdProduct = res.body as { name: string };
    expect(createdProduct.name).toBe('Test Product 2');
  });

  // Get Products by searchTerm
  it('/products (GET) should return products', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .query({ searchTerm: 'Test' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const products = res.body as Array<{ productId: string }>;
    expect(products.some((p) => p.productId === productId)).toBe(true);
  });

  // Update Product by productId
  it('/products/:productId (PUT) should update product', async () => {
    const data = {
      name: 'Updated Product',
      price: 3.99,
    };
    const res = await request(app.getHttpServer())
      .put(`/products/${productId}`)
      .set('Cookie', adminCookie)
      .send(data);
    expect(res.status).toBe(200);
    const updatedProduct = res.body as { name: string; price: number };
    expect(updatedProduct.name).toBe('Updated Product');
    expect(updatedProduct.price).toBe(3.99);
  });

  // Delete Product
  it('/products/:productId (DELETE) should delete product', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    // Check that product is deleted
    const getRes = await request(app.getHttpServer())
      .get('/products')
      .query({ searchTerm: 'Updated' });
    expect(getRes.status).toBe(200);
    const productsAfterDelete = getRes.body as Array<{ productId: string }>;
    expect(productsAfterDelete.some((p) => p.productId === productId)).toBe(
      false,
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
