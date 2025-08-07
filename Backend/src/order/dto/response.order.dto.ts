import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseOrderDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  totalPrice: number;

  @Expose()
  createdAt: Date;
}
