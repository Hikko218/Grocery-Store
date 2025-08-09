import { Test, TestingModule } from '@nestjs/testing';
import { CartItemService } from './cartitem.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto } from './dto/create.cartitem.dto';
import { UpdateCartItemDto } from './dto/update.cartitem.dto';

describe('CartItemService', () => {
  let service: CartItemService;
  let prisma: PrismaService;
  let cartId: number;
  let productId: string;
  let cartItemId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartItemService, PrismaService],
    }).compile();
    service = module.get<CartItemService>(CartItemService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean DB and create test cart and product
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
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
        totalPrice: 0,
      },
      include: { user: true },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create, get, update, and delete a cart item', async () => {
    // Create
    const createDto: CreateCartItemDto = { cartId, productId, quantity: 2 };
    const created = await service.create(createDto);
    expect(created.cartId).toBe(cartId);
    expect(created.productId).toBe(productId);
    expect(created.quantity).toBe(2);
    cartItemId = created.id;

    // Get all
    const all = await service.findAll(cartId);
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].cartId).toBe(cartId);

    // Get one
    const one = await service.findOne(cartItemId);
    expect(one.id).toBe(cartItemId);
    expect(one.cartId).toBe(cartId);

    // Update
    const updateDto: UpdateCartItemDto = { quantity: 5 };
    const updated = await service.update(cartItemId, updateDto);
    expect(updated.quantity).toBe(5);

    // Delete
    const del = await service.remove(cartItemId);
    expect(del.success).toBe(true);
    const afterDelete = await service.findAll(cartId);
    expect(afterDelete.find((i) => i.id === cartItemId)).toBeUndefined();
  });
});
