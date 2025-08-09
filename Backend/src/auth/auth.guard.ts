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

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Annahme: req.user ist vom JWT-Guard gesetzt und hat eine "role" Eigenschaft
    if (req.user && req.user.role === 'admin') {
      Logger.log('AdminGuard: access granted');
      return true;
    }
    Logger.log('AdminGuard: access denied');
    throw new ForbiddenException('Admin access required');
  }
}
