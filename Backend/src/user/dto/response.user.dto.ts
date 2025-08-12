import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseUserDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  firstName?: string | null;

  @Expose()
  lastName?: string | null;

  @Expose()
  phone?: string | null;

  @Expose()
  role!: string;

  @Expose()
  createdAt!: string;
}
