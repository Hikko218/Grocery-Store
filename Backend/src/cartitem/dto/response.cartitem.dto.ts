import { Type } from 'class-transformer';

export class ResponseCartItemDto {
  id!: number;
  cartId!: number;
  productId!: string;

  @Type(() => Number)
  quantity!: number;

  @Type(() => Date)
  createdAt!: Date;
}
