import { Module } from '@nestjs/common';
import { R2Service } from './r2.service';
import { UploadController } from './upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [AuthModule],
  controllers: [UploadController],
  providers:   [R2Service],
  exports:     [R2Service],   // so ProductsModule can use it too
})
export class UploadModule {}
