import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class ResponseCartItemDto {
  @Expose()
  id: number;

  @Expose()
  cartId: number;

  @Expose()
  productId: string;

  @Expose()
  quantity: number;

  @Expose()
  createdAt: string;
}
