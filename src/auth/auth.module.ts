import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Module({
  providers: [FirebaseService, FirebaseAuthGuard],
  exports: [FirebaseService, FirebaseAuthGuard],
})
export class AuthModule {}
