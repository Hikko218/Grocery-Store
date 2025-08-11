import { AddressType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  street?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  street2?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @IsOptional()
  @IsPhoneNumber('DE', { message: 'phone must be a valid DE phone number' })
  phone?: string | null;
}
