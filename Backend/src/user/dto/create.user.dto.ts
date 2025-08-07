import { IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}
