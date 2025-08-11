import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CreateAddressDto } from './dto/create.address.dto';
import { UpdateAddressDto } from './dto/update.address.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseAddressDto } from './dto/response.address.dto';

// Typisiertes Request-Interface für JWT-User
interface AuthenticatedRequest extends Request {
  user?: {
    sub?: number;
    userId?: number;
    id?: number;
    email?: string;
    role?: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('address')
export class AddressController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly addressService: AddressService) {}

  // Helfer zum sicheren Lesen der UserId
  private getUserId(req: AuthenticatedRequest): number {
    const u = req.user;
    const userId = u?.sub ?? u?.userId ?? u?.id;
    if (!userId) throw new BadRequestException('Missing user');
    return Number(userId);
  }

  @Get()
  @HttpCode(200)
  async findAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseAddressDto[]> {
    try {
      const userId = this.getUserId(req);
      const items = await this.addressService.findAllByUser(userId);
      Logger.log(`Addresses retrieved for user ${userId}`);
      return plainToInstance(ResponseAddressDto, items, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      Logger.error(`Error retrieving addresses: ${error}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Cannot retrieve addresses');
    }
  }

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAddressDto,
  ): Promise<ResponseAddressDto> {
    try {
      const userId = this.getUserId(req);
      const created = await this.addressService.create(userId, dto);
      Logger.log(`Address created for user ${userId}`);
      return plainToInstance(ResponseAddressDto, created, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      Logger.error(`Error creating address: ${error}`);
      throw new BadRequestException('Cannot create address');
    }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ): Promise<ResponseAddressDto> {
    try {
      const userId = this.getUserId(req);
      const updated = await this.addressService.update(id, userId, dto);
      Logger.log(`Address ${id} updated for user ${userId}`);
      return plainToInstance(ResponseAddressDto, updated, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      Logger.error(`Error updating address ${id}: ${error}`);
      throw new BadRequestException('Cannot update address');
    }
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    try {
      const userId = this.getUserId(req);
      const result = await this.addressService.remove(id, userId);
      Logger.log(`Address ${id} deleted for user ${userId}`);
      return result;
    } catch (error) {
      Logger.error(`Error deleting address ${id}: ${error}`);
      throw new BadRequestException('Cannot delete address');
    }
  }
}
