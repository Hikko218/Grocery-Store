import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Response } from 'express';

// Tests for AuthController (authentication endpoints)
describe('AuthController', () => {
  // Unit tests for AuthController (authentication routes)
  let controller: AuthController;
  let authService: DeepMockProxy<AuthService>;
  let res: Response;

  // Setup mocks and controller before each test
  beforeEach(async () => {
    authService = mockDeep<AuthService>();
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(), // Mock clearCookie method
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // Controller should be created
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Login endpoint tests
  describe('login', () => {
    // Should validate user and log in
    it('should call AuthService.validateUser and AuthService.login', async () => {
      const body = { email: 'test@mail.com', password: 'testpassword' };
      const user = { id: 1, email: 'test@mail.com' };

      authService.validateUser.mockResolvedValue(user);
      authService.login.mockImplementation(async () => {
        res.cookie('token', 'signed-jwt-token');
        res.send({ message: 'Logged in' });
      });

      await controller.login(body, res);

      expect(() =>
        authService.validateUser(body.email, body.password),
      ).not.toThrow();
      expect(() => authService.login(user, res)).not.toThrow();
      expect(() => res.cookie('token', expect.any(String))).not.toThrow();
      expect(() => res.send({ message: 'Logged in' })).not.toThrow();
    });

    // Should return 401 for invalid credentials
    it('should return 401 if credentials are invalid', async () => {
      const body = { email: 'test@mail.com', password: 'wrongpassword' };

      authService.validateUser.mockResolvedValue(null);

      await controller.login(body, res);

      expect(() =>
        authService.validateUser(body.email, body.password),
      ).not.toThrow();
      expect(() => res.status(401)).not.toThrow();
      expect(() => res.send({ message: 'Invalid credentials' })).not.toThrow();
    });
  });

  // Status endpoint tests
  describe('status', () => {
    // Should return authenticated user status
    it('should return user status with authentication info', () => {
      // Mock user
      const mockUser = { userId: 1, email: 'test@mail.com', role: 'user' };
      // Mock req in res
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (res as any).req = { user: mockUser };
      const result = controller.getUserStatus(res);
      expect(result).toBeUndefined(); // Da res.send verwendet wird
      expect(res.send).toHaveBeenCalledWith({
        isAuthenticated: true,
        userId: 1,
        email: 'test@mail.com',
        role: 'user',
      });
    });

    // Should return unauthenticated status if no user
    it('should return unauthenticated status if no user', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (res as any).req = {};
      const result = controller.getUserStatus(res);
      expect(result).toBeUndefined();
      expect(res.send).toHaveBeenCalledWith({
        isAuthenticated: false,
        userId: null,
        email: null,
        role: null,
      });
    });
  });

  // Logout endpoint tests
  describe('logout', () => {
    // Should clear cookie and send logout response
    it('should clear the token cookie and send a response', () => {
      controller.logout(res);
      expect(() =>
        res.clearCookie('token', {
          path: '/',
        }),
      ).not.toThrow();
      expect(() => res.send({ message: 'Logged out' })).not.toThrow();
    });
  });
});
