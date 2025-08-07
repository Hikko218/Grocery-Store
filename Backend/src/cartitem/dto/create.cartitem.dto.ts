import { IsInt, IsString, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsInt()
  @IsPositive()
  cartId: number;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
