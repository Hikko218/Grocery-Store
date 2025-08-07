import { IsInt, IsNumber, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  orderId: number;

  @IsString()
  productId: string;

  @IsInt()
  quantity: number;

  @IsNumber()
  price: number;
}
