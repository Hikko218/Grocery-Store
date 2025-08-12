import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

interface User {
  userId: number;
  email: string;
  role?: string;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Guard to restrict access to admin users
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check if user has admin role
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.user && req.user.role === 'admin') {
      Logger.log('AdminGuard: access granted');
      return true;
    }
    Logger.log('AdminGuard: access denied');
    throw new ForbiddenException('Admin access required');
  }
}
