import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseOrderItemDto {
  @Expose()
  id: number;

  @Expose()
  orderId: number;

  @Expose()
  productId: string;

  @Expose()
  quantity: number;

  @Expose()
  price!: number | null;

  @Expose()
  createdAt: Date;
}
