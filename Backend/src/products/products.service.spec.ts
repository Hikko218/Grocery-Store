import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

// Unit tests for ProductsService (product CRUD logic)
beforeAll(() => {
  // Deploy test migrations before running tests
});

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    // Setup test module and clean database before each test
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Clean database
    await service['prisma'].product.deleteMany({});
    await service['prisma'].user.deleteMany({});
  });

  it('should be defined', () => {
    // Check service is defined
    expect(service).toBeDefined();
  });

  it('create, get, update, and delete a product', async () => {
    // Test product creation, retrieval, update, and deletion
    // create product
    const product = await service.createProduct({
      productId: 'test-product-1',
      name: 'Test Product',
      brand: 'Test Brand',
      category: 'Test Category',
      price: 1.99,
      imageUrl: 'test.jpg',
    });
    expect(product).toBeDefined();
    expect(product.name).toBe('Test Product');

    // get products by searchTerm
    const products = await service.getProducts('Test');
    expect(Array.isArray(products)).toBe(true);
    expect(products && products.length).toBeGreaterThan(0);

    // update product
    const updatedProduct = await service.updateProduct(product.productId, {
      name: 'Updated Product',
      price: 2.99,
    });
    expect(updatedProduct.name).toBe('Updated Product');
    expect(updatedProduct.price).toBe(2.99);

    // delete product
    await service.deleteProduct(product.productId);
    const deletedProducts = await service.getProducts('Updated');
    expect(Array.isArray(deletedProducts)).toBe(true);
    expect(deletedProducts && deletedProducts.length).toBe(0);
  });
});
