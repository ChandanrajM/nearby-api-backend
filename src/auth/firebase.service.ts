import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      const projectId = this.config.get<string>('firebase.projectId');
      const privateKey = this.config.get<string>('firebase.privateKey');
      const clientEmail = this.config.get<string>('firebase.clientEmail');

      const hasCertConfig = projectId && privateKey && clientEmail;

      try {
        if (hasCertConfig) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey,
              clientEmail,
            }),
          });
          this.logger.log('✅ Firebase Admin initialized via Service Account Key');
        } else {
          // Fallback to Application Default Credentials (ADC)
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId || undefined,
          });
          this.logger.log('✅ Firebase Admin initialized via Application Default Credentials');
        }
      } catch (error) {
        this.logger.error('❌ Firebase Admin initialization failed', error.stack);
      }
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(token);
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUser(uid);
  }
}
