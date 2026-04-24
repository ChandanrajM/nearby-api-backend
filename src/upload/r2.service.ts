import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>('r2.accountId');

    // R2 uses the S3-compatible API endpoint
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     this.config.get<string>('r2.accessKeyId')!,
        secretAccessKey: this.config.get<string>('r2.secretAccessKey')!,
      },
    });

    this.bucket    = this.config.get<string>('r2.bucketName')!;
    this.publicUrl = this.config.get<string>('r2.publicUrl')!;
  }

  // ── Generate presigned URL ────────────────────────────────
  // Android app calls this first, then uploads directly to R2
  // No image bytes ever touch your NestJS server
  async generatePresignedUrl(options: {
    folder:      string;   // e.g. "products" or "stores"
    contentType: string;   // e.g. "image/jpeg"
    fileExt:     string;   // e.g. "jpg"
  }): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    // Build a unique file path e.g. products/uuid.jpg
    const key = `${options.folder}/${uuid()}.${options.fileExt}`;

    const command = new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      ContentType: options.contentType,
    });

    // Presigned URL expires in 5 minutes
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300,
    });

    // Public URL the Android app stores after upload
    const publicUrl = `${this.publicUrl}/${key}`;

    this.logger.log(`Generated presigned URL for key: ${key}`);

    return { uploadUrl, publicUrl, key };
  }

  // ── Delete a file from R2 ─────────────────────────────────
  // Called when a product is deleted
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key:    key,
    });
    await this.client.send(command);
    this.logger.log(`Deleted file: ${key}`);
  }

  // ── Check if a file exists in R2 ─────────────────────────
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
