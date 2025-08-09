import { IsInt, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  @IsOptional()
  quantity?: number;
}
