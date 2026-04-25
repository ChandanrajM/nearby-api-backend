import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin already initialized — skipping');
      return;
    }

    const projectId   = this.config.get<string>('firebase.projectId');
    const privateKey  = this.config.get<string>('firebase.privateKey');
    const clientEmail = this.config.get<string>('firebase.clientEmail');

    if (projectId && privateKey && clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      this.logger.log('✅ Firebase Admin initialized via Cert');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId || undefined,
      });
      this.logger.log('✅ Firebase Admin initialized via ADC');
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(token, true);
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUser(uid);
  }

  async revokeTokens(uid: string): Promise<void> {
    await admin.auth().revokeRefreshTokens(uid);
    this.logger.log(`Revoked all tokens for user: ${uid}`);
  }
}
