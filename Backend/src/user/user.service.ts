import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { ResponseUserDto } from './dto/response.user.dto';
import { User as UserModel, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type OrderItemResponse = {
  id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  } | null;
};
type OrderResponse = {
  id: number;
  userId: number;
  createdAt: string;
  paymentStatus: string;
  totalPrice: number;
  items: OrderItemResponse[];
};

type IncludedOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;

function iso(d: Date | string): string {
  return d instanceof Date
    ? d.toISOString()
    : new Date(String(d)).toISOString();
}

function toOrderResponse(o: IncludedOrder): OrderResponse {
  return {
    id: o.id,
    userId: o.userId,
    createdAt: iso(o.createdAt),
    paymentStatus: String(o.paymentStatus),
    totalPrice: Number(o.totalPrice ?? 0),
    items: (o.items ?? []).map((it) => ({
      id: it.id,
      quantity: it.quantity,
      // Prisma.Decimal -> number
      price: Number(it.price ?? 0),
      product: it.product
        ? {
            id: it.product.id,
            name: it.product.name,
            price: Number(it.product.price ?? 0),
            imageUrl: it.product.imageUrl ?? null,
          }
        : null,
    })),
  };
}

function toUserResponse(
  u: UserModel,
  orders?: OrderResponse[],
): ResponseUserDto & { orders?: OrderResponse[] } {
  const createdAt =
    u.createdAt instanceof Date
      ? u.createdAt.toISOString()
      : new Date(String(u.createdAt)).toISOString();

  return {
    id: u.id,
    email: String(u.email),
    firstName: u.firstName != null ? String(u.firstName) : null,
    lastName: u.lastName != null ? String(u.lastName) : null,
    phone: u.phone != null ? String(u.phone) : null,
    role: String(u.role),
    createdAt,
    ...(orders ? { orders } : {}),
  };
}

@Injectable()
export class UserService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Create user with hashed password
  async create(data: CreateUserDto): Promise<ResponseUserDto> {
    const hashedPassword: string = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        phone: data.phone ?? null,
        role: data.role ?? 'user',
      },
    });
    return toUserResponse(user);
  }

  // Get user by email (optional: include orders)
  async getUserbyEmail(
    email: string,
    opts?: { includeOrders?: boolean },
  ): Promise<(ResponseUserDto & { orders?: OrderResponse[] }) | null> {
    if (opts?.includeOrders) {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          orders: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!user) return null;
      const orders = user.orders.map((o) => toOrderResponse(o));
      return toUserResponse(user, orders);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? toUserResponse(user) : null;
  }

  // Get user by id (optional: include orders)
  async findById(
    id: number,
    opts?: { includeOrders?: boolean },
  ): Promise<ResponseUserDto & { orders?: OrderResponse[] }> {
    if (opts?.includeOrders) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          orders: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!user) throw new NotFoundException('User not found');
      const orders = user.orders.map((o) => toOrderResponse(o));
      return toUserResponse(user, orders);
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toUserResponse(user);
  }

  // Update user info
  async update(id: number, data: UpdateUserDto): Promise<ResponseUserDto> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');

    const password = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email ?? undefined,
        password,
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        phone: data.phone ?? undefined,
        role: data.role ?? undefined,
      },
    });
    return toUserResponse(user);
  }

  // Delete user
  async delete(id: number): Promise<{ success: boolean }> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // Compat-Wrapper für Tests
  async createUser(data: CreateUserDto): Promise<ResponseUserDto> {
    return this.create(data);
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<ResponseUserDto> {
    return this.update(id, data);
  }

  async deleteUser(id: number): Promise<{ success: boolean }> {
    return this.delete(id);
  }
}
