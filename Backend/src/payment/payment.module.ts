import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeWebhookController } from '../webhook/stripe.controller';

@Module({
  controllers: [PaymentController, StripeWebhookController],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}
