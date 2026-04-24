import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../../auth/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing Authorization header. Expected: Bearer <firebase-token>',
      );
    }

    const token = authHeader.split(' ')[1];
    const devToken = this.config.get<string>('DEV_AUTH_TOKEN');

    // ── DEV BYPASS ──────────────────────────────────────────
    // If we are in dev and the token matches our secret bypass token
    if (process.env.NODE_ENV !== 'production' && devToken && token === devToken) {
      this.logger.debug('🛡️ Using developer bypass token');
      
      // Upsert a default test user so the @CurrentUser() decorator works
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
    // ────────────────────────────────────────────────────────

    let decodedToken: any;
    try {
      decodedToken = await this.firebaseService.verifyToken(token);
    } catch (error) {
      this.logger.warn(`Invalid Firebase token: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Schema uses firebaseUid instead of firebaseId, and role BUYER instead of SHOPPER
    const user = await this.prisma.user.upsert({
      where: { firebaseUid: decodedToken.uid },
      update: {
        name: decodedToken.name ?? undefined,
        email: decodedToken.email ?? undefined,
        phone: decodedToken.phone_number ?? undefined,
      },
      create: {
        firebaseUid: decodedToken.uid,
        name: decodedToken.name ?? decodedToken.email ?? 'User',
        email: decodedToken.email ?? `${decodedToken.uid}@nearby.auth`,
        phone: decodedToken.phone_number ?? null,
        role: 'BUYER',
      },
    });

    request.user = user;
    return true;
  }
}
