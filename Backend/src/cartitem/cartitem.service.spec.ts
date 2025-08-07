import { Test, TestingModule } from '@nestjs/testing';
import { CartItemService } from './cartitem.service';

describe('CartitemService', () => {
  let service: CartItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartItemService],
    }).compile();

    service = module.get<CartItemService>(CartItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
