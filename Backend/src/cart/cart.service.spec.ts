import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCartDto } from './dto/update.cart.dto';

describe('CartService', () => {
  let service: CartService;
  let prisma: PrismaService;
  let userId: number;
  let cartId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, PrismaService],
    }).compile();
    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean DB and create test user and cart
    await prisma.cart.deleteMany({});
    await prisma.user.deleteMany({});
    const user = await prisma.user.create({
      data: { email: `cart${Date.now()}@test.de`, password: 'pw' },
    });
    userId = user.id;
    const cart = await prisma.cart.create({ data: { userId } });
    cartId = cart.id;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get, update, and delete a cart', async () => {
    // Get cart by userId
    const cartByUser = await service.findOneByUserId(userId);
    expect(cartByUser).toBeDefined();
    if (!cartByUser) throw new Error('Cart should exist');
    expect(cartByUser.userId).toBe(userId);

    // Update
    const updateDto: UpdateCartDto = { userId };
    const updated = await service.updateCart(cartId, updateDto);
    expect(updated.userId).toBe(userId);

    // Delete
    const del = await service.deleteCart(cartId);
    expect(del.success).toBe(true);
    const afterDelete = await service.findOneByUserId(userId);
    expect(afterDelete).toBeNull();
  });
});
