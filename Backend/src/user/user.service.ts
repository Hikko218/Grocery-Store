import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  // Inject Prisma service
  // eslint-disable-next-line no-unused-vars
  constructor(private prisma: PrismaService) {}

  // Get user by email
  async getUserbyEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email } });
  }

  // Get user by id
  async getUserbyId(userId: number) {
    return this.prisma.user.findUnique({ where: { id: Number(userId) } });
  }

  // Create user with hashed password
  async createUser(data: CreateUserDto) {
    try {
      const hashedPassword: string = await bcrypt.hash(data.password, 10);
      return this.prisma.user.create({
        data: { ...data, password: hashedPassword },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException('Registration failed');
    }
  }

  // Update user info
  async updateUser(userId: number, data: UpdateUserDto) {
    try {
      // Fetch the existing user
      const existingUser = await this.prisma.user.findUnique({
        where: { id: Number(userId) },
      });

      // Check if user exists
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Prepare updated object
      const updates: UpdateUserDto = {};

      // Check and update email
      if (data.email !== existingUser.email) {
        updates.email = data.email;
      }
      // Check and hash password if updated
      if (data.password) {
        const isSamePassword = await bcrypt.compare(
          data.password,
          existingUser.password,
        );
        if (!isSamePassword) {
          updates.password = await bcrypt.hash(data.password, 10);
        }
      }
      // Throw error if no changes detected
      if (Object.keys(updates).length === 0) {
        throw new Error('No changes detected');
      }
      // Update user in the database
      return await this.prisma.user.update({
        where: { id: Number(userId) },
        data: updates,
      });
    } catch (error) {
      // Handle errors
      throw new Error(`Error while updating user: ${error}`);
    }
  }

  // Delete user
  async deleteUser(userId: number) {
    return await this.prisma.user.delete({ where: { id: Number(userId) } });
  }
}
