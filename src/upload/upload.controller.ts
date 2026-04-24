import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { R2Service } from './r2.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

// Map MIME type → file extension
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

@UseGuards(FirebaseAuthGuard)   // all upload routes require auth
@Controller('upload')
export class UploadController {
  constructor(private r2: R2Service) {}

  // POST /api/v1/upload/presigned-url
  // Android calls this → gets back uploadUrl + publicUrl
  @Post('presigned-url')
  async getPresignedUrl(@Body() dto: GetUploadUrlDto) {
    const fileExt = EXT_MAP[dto.contentType];

    const result = await this.r2.generatePresignedUrl({
      folder:      dto.folder,
      contentType: dto.contentType,
      fileExt,
    });

    return {
      uploadUrl: result.uploadUrl,   // PUT to this URL from Android
      publicUrl: result.publicUrl,   // save this in your product record
      key:       result.key,         // save this to delete the file later
      expiresIn: 300,                // seconds until uploadUrl expires
    };
  }
}
