import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddressType } from '@prisma/client';
import { CreateAddressDto } from './dto/create.address.dto';
import { UpdateAddressDto } from './dto/update.address.dto';
import { ResponseAddressDto } from './dto/response.address.dto';

// Service for address management and database operations
@Injectable()
export class AddressService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Convert address entity to response DTO
  private toResponse(a: {
    id: number;
    userId: number;
    type: AddressType;
    isDefault: boolean;
    name: string | null;
    street: string;
    street2: string | null;
    postalCode: string;
    city: string;
    country: string;
    phone: string | null;
    createdAt: Date | string;
  }): ResponseAddressDto {
    return {
      id: a.id,
      userId: a.userId,
      type: a.type,
      isDefault: a.isDefault,
      name: a.name,
      street: a.street,
      street2: a.street2,
      postalCode: a.postalCode,
      city: a.city,
      country: a.country,
      phone: a.phone,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt, // <- Assertion entfernt
    };
  }

  // Get all addresses for a user
  async findAllByUser(userId: number): Promise<ResponseAddressDto[]> {
    const list = await this.prisma.address.findMany({
      where: { userId: Number(userId) },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return list.map((a) => this.toResponse(a));
  }

  // Create a new address for user
  async create(
    userId: number,
    dto: CreateAddressDto,
  ): Promise<ResponseAddressDto> {
    const type = dto.type; // <- unnötiges "as AddressType" entfernt

    if (dto.isDefault) {
      const created = await this.prisma.$transaction(async (tx) => {
        // <- Param genutzt
        await tx.address.updateMany({
          where: { userId: Number(userId), type },
          data: { isDefault: false },
        });
        return tx.address.create({
          data: {
            userId: Number(userId),
            type,
            isDefault: true,
            name: dto.name ?? null,
            street: dto.street,
            street2: dto.street2 ?? null,
            postalCode: dto.postalCode,
            city: dto.city,
            country: dto.country,
            phone: dto.phone ?? null,
          },
        });
      });
      return this.toResponse(created);
    }

    const created = await this.prisma.address.create({
      data: {
        userId: Number(userId),
        type,
        isDefault: false,
        name: dto.name ?? null,
        street: dto.street,
        street2: dto.street2 ?? null,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country,
        phone: dto.phone ?? null,
      },
    });
    return this.toResponse(created);
  }

  // Update address by id and userId
  async update(
    id: number,
    userId: number,
    dto: UpdateAddressDto,
  ): Promise<ResponseAddressDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id: Number(id), userId: Number(userId) },
    });
    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    const nextType = dto.type ?? existing.type; // <- Assertion entfernt

    if (dto.isDefault === true) {
      const updated = await this.prisma.$transaction(async (tx) => {
        // <- Param genutzt
        await tx.address.updateMany({
          where: { userId: Number(userId), type: nextType },
          data: { isDefault: false },
        });
        return tx.address.update({
          where: { id: Number(id) },
          data: {
            type: nextType,
            isDefault: true,
            name: dto.name ?? undefined,
            street: dto.street ?? undefined,
            street2: dto.street2 ?? undefined,
            postalCode: dto.postalCode ?? undefined,
            city: dto.city ?? undefined,
            country: dto.country ?? undefined,
            phone: dto.phone ?? undefined,
          },
        });
      });
      return this.toResponse(updated);
    }

    const updated = await this.prisma.address.update({
      where: { id: Number(id) },
      data: {
        type: nextType,
        ...(dto.isDefault === false ? { isDefault: false } : {}),
        name: dto.name ?? undefined,
        street: dto.street ?? undefined,
        street2: dto.street2 ?? undefined,
        postalCode: dto.postalCode ?? undefined,
        city: dto.city ?? undefined,
        country: dto.country ?? undefined,
        phone: dto.phone ?? undefined,
      },
    });
    return this.toResponse(updated);
  }

  // Delete address by id and userId
  async remove(id: number, userId: number): Promise<{ success: boolean }> {
    const existing = await this.prisma.address.findFirst({
      where: { id: Number(id), userId: Number(userId) },
    });
    if (!existing) {
      throw new NotFoundException('Address not found');
    }
    await this.prisma.address.delete({ where: { id: Number(id) } });
    return { success: true };
  }

  // Zusätzliche Helfer für Profile-Page

  // Get default address for user and type
  async getDefault(
    userId: number,
    type: AddressType,
  ): Promise<ResponseAddressDto | null> {
    const a = await this.prisma.address.findFirst({
      where: { userId: Number(userId), type, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });
    return a ? this.toResponse(a) : null;
  }

  // Set address as default for user
  async setDefault(userId: number, id: number): Promise<ResponseAddressDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id: Number(id), userId: Number(userId) },
    });
    if (!existing) throw new NotFoundException('Address not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: Number(userId), type: existing.type },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id: Number(id) },
        data: { isDefault: true },
      });
    });
    return this.toResponse(updated);
  }
}
