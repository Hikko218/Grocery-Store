import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
