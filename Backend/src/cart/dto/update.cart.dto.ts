import { IsOptional, IsInt, IsPositive } from 'class-validator';

export class UpdateCartDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;
}
