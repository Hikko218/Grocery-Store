import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './orderitem/orderitem.module';
import { CartModule } from './cart/cart.module';
import { CartItemModule } from './cartitem/cartitem.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    ProductsModule,
    OrderModule,
    OrderItemModule,
    CartModule,
    CartItemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
