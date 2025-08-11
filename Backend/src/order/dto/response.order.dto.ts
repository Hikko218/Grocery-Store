import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseOrderDto {
  @Expose()
  id!: number;

  @Expose()
  userId!: number;

  @Expose()
  totalPrice!: number;

  @Expose()
  createdAt!: string;

  @Expose()
  shippingName!: string;

  @Expose()
  shippingStreet!: string;

  @Expose()
  shippingStreet2?: string | null;

  @Expose()
  shippingPostalCode!: string;

  @Expose()
  shippingCity!: string;

  @Expose()
  shippingCountry!: string;

  @Expose()
  shippingPhone?: string | null;
}
