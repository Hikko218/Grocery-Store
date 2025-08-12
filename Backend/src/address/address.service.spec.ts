import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AddressService', () => {
  let service: AddressService;

  // separat, damit $transaction typisiert darauf zugreifen kann
  const prismaAddress = {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  };

  const prismaMock = {
    address: prismaAddress,
    // typisierte Funktionsform von $transaction (ohne any-Return)
    $transaction: jest.fn(
      <T>(
        fn: (_tx: { address: typeof prismaAddress }) => Promise<T> | T,
      ): Promise<T> => {
        const result = fn({ address: prismaAddress });
        return Promise.resolve(result as T);
      },
    ),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test findAllByUser returns addresses
  it('findAllByUser returns list', async () => {
    const spy = jest.spyOn(prismaAddress, 'findMany');
    await service.findAllByUser(1);
    expect(spy).toHaveBeenCalled(); // vermeidet unbound-method
  });
});
