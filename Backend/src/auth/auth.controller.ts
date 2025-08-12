import {
  Controller,
  Post,
  Get,
  Res,
  UseGuards,
  Body,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';

interface LoginBody {
  email: string;
  password: string;
}

interface User {
  userId: number;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Controller('auth')
export class AuthController {
  // Service injection
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login: Login with credentials
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginBody, @Res() res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    await this.authService.login(user, res);
  }

  // GET /auth/status: Get authentication status (JWT protected)
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  getUserStatus(@Res() res: Response) {
    const req = res.req as unknown as AuthenticatedRequest;
    const user = req.user;
    return res.send({
      isAuthenticated: !!user,
      userId: user?.userId ?? null,
      email: user?.email ?? null,
      role: user?.role ?? null,
    });
  }

  // Logout route
  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie('token', { path: '/' });
    return res.send({ message: 'Logged out' });
  }
}
