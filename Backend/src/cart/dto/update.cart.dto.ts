import { IsOptional, IsNumber } from 'class-validator';

export class UpdateCartDto {
  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}
