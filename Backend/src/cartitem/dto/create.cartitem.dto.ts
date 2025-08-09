import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCartItemDto {
  @IsInt()
  cartId!: number;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @IsOptional()
  quantity?: number;
}
