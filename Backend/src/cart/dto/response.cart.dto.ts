import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class ResponseCartDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  createdAt: string;
}
