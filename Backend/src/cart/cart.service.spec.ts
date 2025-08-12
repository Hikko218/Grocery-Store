import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCartDto } from './dto/update.cart.dto';

// Unit tests for CartService (cart CRUD logic)
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

    const createdCart = await service.createCart({ userId });
    cartId = createdCart.id;
  });

  it('should be defined', () => {
    // Check service is defined
    expect(service).toBeDefined();
  });

  it('should get, update, and delete a cart', async () => {
    // Test get, update, and delete cart

    // Get cart by userId
    const cartByUser = await service.findOneByUserId(userId);
    expect(cartByUser).toBeDefined();
    expect(cartByUser && cartByUser.userId).toBe(userId);

    // Update totalPrice
    const updateDto: UpdateCartDto = { totalPrice: 42.5 };
    const updated = await service.updateCart(cartId, updateDto);
    expect(updated.totalPrice).toBe(42.5);

    // Delete
    const del = await service.deleteCart(cartId);
    expect(del.success).toBe(true);

    const afterDelete = await service.findOneByUserId(userId);
    expect(afterDelete).toBeNull();
  });
});
