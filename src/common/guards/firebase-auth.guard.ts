import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector }        from '@nestjs/core';
import { FirebaseService }  from '../../auth/firebase.service';
import { PrismaService }    from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY }    from '../decorators/public.decorator';
import { ROLES_KEY }        from '../decorators/roles.decorator';
import { Role }             from '@prisma/client';
import { ConfigService }    from '@nestjs/config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly prisma:   PrismaService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request    = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header missing or malformed. ' +
        'Expected format: Bearer <firebase-id-token>',
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      throw new UnauthorizedException('Token is empty');
    }

    const devToken = this.config.get<string>('DEV_AUTH_TOKEN');
    if (process.env.NODE_ENV !== 'production' && devToken && token === devToken) {
      this.logger.debug('🛡️ Using developer bypass token');
      const testUser = await this.prisma.user.upsert({
        where: { firebaseUid: 'dev-user-id' },
        update: {},
        create: {
          firebaseUid: 'dev-user-id',
          name: 'Dev Tester',
          email: 'dev@nearby.app',
          role: 'BUYER',
        },
      });
      request.user = testUser;
      return true;
    }

    let decoded: any;
    try {
      decoded = await this.firebase.verifyToken(token);
    } catch (error) {
      const msg = this.getFirebaseErrorMessage(error.code);
      this.logger.warn(`Token verification failed: ${error.code}`);
      throw new UnauthorizedException(msg);
    }

    let user: any;
    try {
      user = await this.prisma.user.upsert({
        where:  { firebaseUid: decoded.uid },
        update: {
          ...(decoded.name         && { name:  decoded.name }),
          ...(decoded.email        && { email: decoded.email }),
          ...(decoded.phone_number && { phone: decoded.phone_number }),
        },
        create: {
          firebaseUid: decoded.uid,
          name:       decoded.name          ?? decoded.email ?? 'User',
          email:      decoded.email         ?? `${decoded.uid}@nearby.auth`,
          phone:      decoded.phone_number  ?? null,
          role:       Role.BUYER,
        },
      });
    } catch (dbError) {
      this.logger.error('DB upsert failed during auth', dbError);
      throw new UnauthorizedException('Authentication failed — DB error');
    }

    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required role: ${requiredRoles.join(' or ')}. ` +
          `Your role: ${user.role}`,
        );
      }
    }

    return true;
  }

  private getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/id-token-expired': 'Your session has expired. Please log in again.',
      'auth/id-token-revoked': 'Your session was revoked. Please log in again.',
      'auth/invalid-id-token': 'Invalid token. Please log in again.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'User not found.',
      'auth/argument-error': 'Malformed token.',
    };
    return messages[code] ?? 'Authentication failed. Please log in again.';
  }
}
