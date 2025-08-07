import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseProductDto {
  @Expose()
  id: number;

  @Expose()
  productId: string;

  @Expose()
  name: string;

  @Expose()
  brand?: string;

  @Expose()
  category?: string;

  @Expose()
  quantity?: string;

  @Expose()
  packaging?: string;

  @Expose()
  country?: string;

  @Expose()
  ingredients?: string;

  @Expose()
  calories?: string;

  @Expose()
  price?: number;

  @Expose()
  imageUrl?: string;

  @Expose()
  createdAt: Date;
}
