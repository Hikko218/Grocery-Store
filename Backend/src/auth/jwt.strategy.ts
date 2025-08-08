// NestJS JWT strategy for extracting token from cookies
import { Injectable } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';

// JWT payload interface
interface JwtPayload {
  sub: number;
  email: string;
}

// Express request with cookies
interface RequestWithCookies extends Request {
  cookies: { [key: string]: string };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      // Extract JWT token from cookie named 'token'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req as RequestWithCookies).cookies?.token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret, // must be string | Buffer (not undefined)
    });
  }

  // Validate and attach user info to request
  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
