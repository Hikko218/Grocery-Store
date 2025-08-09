/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  email: string;
  id: number;
}

@Injectable()
export class AuthService {
  // Inject JWT, user, and Prisma services
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  // Validate user credentials
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, email: user.email };
  }

  // Login: set JWT cookie and send response
  async login(user: AuthUser, res: Response) {
    const dbUser = await this.prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });
    const payload = {
      email: user.email,
      sub: user.id,
      role: dbUser?.role,
    };
    const token = this.jwtService.sign(payload);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.send({
      message: 'Logged in',
      userId: user.id,
      email: user.email,
      role: dbUser?.role,
    });
  }
}
