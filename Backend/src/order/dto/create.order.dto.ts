import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsString()
  @IsNotEmpty()
  shippingName!: string;

  @IsString()
  @IsNotEmpty()
  shippingStreet!: string;

  @IsString()
  @IsOptional()
  shippingStreet2?: string;

  @IsString()
  @IsNotEmpty()
  shippingPostalCode!: string;

  @IsString()
  @IsNotEmpty()
  shippingCity!: string;

  @IsString()
  @IsNotEmpty()
  shippingCountry!: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'shippingPhone must be a valid phone number',
  })
  shippingPhone?: string;
}
