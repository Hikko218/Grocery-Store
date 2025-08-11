import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { ResponseUserDto } from './dto/response.user.dto';
import { User as UserModel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function toUserResponse(u: UserModel): ResponseUserDto {
  const createdAt =
    u.createdAt instanceof Date
      ? u.createdAt.toISOString()
      : new Date(String(u.createdAt)).toISOString();

  return {
    id: u.id,
    email: String(u.email),
    name: u.name != null ? String(u.name) : null,
    phone: u.phone != null ? String(u.phone) : null,
    role: String(u.role),
    createdAt,
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
        name: data.name ?? null,
        phone: data.phone ?? null,
        role: data.role ?? 'user',
      },
    });
    return toUserResponse(user);
  }

  // Get user by email
  async getUserbyEmail(email: string): Promise<ResponseUserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? toUserResponse(user) : null;
  }

  // Get user by id
  async findById(id: number): Promise<ResponseUserDto> {
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
        name: data.name ?? undefined,
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
