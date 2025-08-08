import { AuthService } from './auth.service';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: { sign: jest.Mock };
  let userService: Partial<UserService>;

  // Unit tests for AuthService (authentication logic)
  beforeEach(() => {
    userService = {
      getUserbyEmail: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    prisma = mockDeep<PrismaService>();
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };
    authService = new AuthService(
      jwtService as unknown as import('@nestjs/jwt').JwtService,
      userService as UserService,
      prisma as PrismaService,
    );
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const user = {
        id: 1,
        email: 'test@mail.com',
        password: 'hashed',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await authService.validateUser('test@mail.com', 'pw');
      expect(result).toEqual({
        id: 1,
        email: 'test@mail.com',
      });
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await authService.validateUser('test@mail.com', 'pw');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const user = {
        id: 1,
        email: 'test@mail.com',
        password: 'hashed',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await authService.validateUser('test@mail.com', 'pw');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should set cookie and send response', async () => {
      const user = { id: 1, username: 'test', email: 'test@mail.com' };
      const cookieMock = jest.fn(() => res);
      const sendMock = jest.fn(() => undefined);
      const res = {
        cookie: cookieMock,
        send: sendMock,
      } as unknown as Response;
      await authService.login(user, res);
      expect(() => jwtService.sign).toBeDefined();
      expect(cookieMock).toHaveBeenCalledWith(
        'token',
        'signed-jwt-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(sendMock).toHaveBeenCalledWith({
        email: 'test@mail.com',
        message: 'Logged in',
        userId: user.id,
      });
    });
  });
});
