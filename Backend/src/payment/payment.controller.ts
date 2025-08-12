import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PaymentService } from './payment.service';

type AuthReq = Request & {
  user?: { id?: number; userId?: number; sub?: number };
};
function getUserId(req: AuthReq): number {
  const id = Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);
  if (!Number.isFinite(id)) throw new BadRequestException('Missing user id');
  return id;
}

type ShippingDto = {
  name: string;
  street: string;
  street2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
};
type CreateIntentBody = { shipping: ShippingDto };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateShipping(s: unknown): ShippingDto {
  const x = s as Partial<ShippingDto> | undefined;
  if (
    !x ||
    !isNonEmptyString(x.name) ||
    !isNonEmptyString(x.street) ||
    !isNonEmptyString(x.postalCode) ||
    !isNonEmptyString(x.city) ||
    !isNonEmptyString(x.country)
  ) {
    throw new BadRequestException('Invalid shipping address');
  }
  return {
    name: x.name,
    street: x.street,
    street2: x.street2 ?? null,
    postalCode: x.postalCode,
    city: x.city,
    country: x.country,
    phone: x.phone ?? null,
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('payment')
export class PaymentController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly payments: PaymentService) {}

  @Post('create-intent')
  @HttpCode(200)
  async createIntent(@Req() req: AuthReq, @Body() body: CreateIntentBody) {
    const userId = getUserId(req);
    const shipping = validateShipping(body?.shipping);
    try {
      const { orderId, clientSecret } =
        await this.payments.createOrderAndIntent({
          userId,
          shipping,
        });
      return { orderId, clientSecret };
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to create payment intent';
      throw new BadRequestException(message);
    }
  }
}
