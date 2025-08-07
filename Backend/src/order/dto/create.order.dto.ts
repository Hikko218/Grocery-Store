import { IsInt, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  userId: number;

  @IsNumber()
  totalPrice: number;
}
