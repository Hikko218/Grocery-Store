import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { ResponseUserDto } from './dto/response.user.dto';

@Controller('user')
export class UserController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto): Promise<ResponseUserDto> {
    try {
      const user = await this.userService.createUser(dto);
      Logger.log(`Created user ${user.id}`);
      return user;
    } catch (err) {
      Logger.error(
        `Error creating user`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant create user');
    }
  }

  // id-Route vor Email-Route
  @Get('id/:id')
  @HttpCode(200)
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userService.findById(id);
      Logger.log(`Fetched user by id ${id}`);
      return user;
    } catch (err) {
      Logger.error(
        `Error fetching user by id ${id}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new NotFoundException('Cant get user');
    }
  }

  @Get(':email')
  @HttpCode(200)
  async getByEmail(@Param('email') email: string): Promise<ResponseUserDto> {
    try {
      const user = await this.userService.getUserbyEmail(email);
      if (!user) {
        Logger.warn(`User with email ${email} not found`);
        throw new NotFoundException('User not found');
      }
      Logger.log(`Fetched user by email ${email}`);
      return user;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      Logger.error(
        `Error fetching user by email ${email}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new NotFoundException('Cant get user');
    }
  }

  @Put(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userService.updateUser(id, dto);
      Logger.log(`Updated user ${id}`);
      return user;
    } catch (err) {
      Logger.error(
        `Error updating user ${id}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant update user');
    }
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    try {
      const res = await this.userService.deleteUser(id);
      Logger.log(`Deleted user ${id}`);
      return res;
    } catch (err) {
      Logger.error(
        `Error deleting user ${id}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException('Cant delete user');
    }
  }
}
