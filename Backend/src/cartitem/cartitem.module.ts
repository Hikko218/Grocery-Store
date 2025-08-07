import { Module } from '@nestjs/common';
import { CartItemService } from './cartitem.service';
import { CartItemController } from './cartitem.controller';

@Module({
  providers: [CartItemService],
  controllers: [CartItemController],
})
export class CartItemModule {}
