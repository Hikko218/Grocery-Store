import { IsNumber, IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsString()
  shippingName?: string;

  @IsOptional()
  @IsString()
  shippingStreet?: string;

  @IsOptional()
  @IsString()
  shippingStreet2?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber(undefined, {
    message: 'shippingPhone must be a valid phone number',
  })
  shippingPhone?: string;
}
