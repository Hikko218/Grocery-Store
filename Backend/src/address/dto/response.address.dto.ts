import { Expose, Transform } from 'class-transformer';
import { AddressType } from '@prisma/client';

export class ResponseAddressDto {
  @Expose()
  id!: number;

  @Expose()
  userId!: number;

  @Expose()
  type!: AddressType;

  @Expose()
  isDefault!: boolean;

  @Expose()
  name!: string | null;

  @Expose()
  street!: string;

  @Expose()
  street2!: string | null;

  @Expose()
  postalCode!: string;

  @Expose()
  city!: string;

  @Expose()
  country!: string;

  @Expose()
  phone!: string | null;

  @Expose()
  @Transform(({ value }): string =>
    value instanceof Date ? value.toISOString() : String(value ?? ''),
  )
  createdAt!: string;
}
