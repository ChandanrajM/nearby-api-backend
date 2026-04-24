import { IsString, IsIn, IsNotEmpty } from 'class-validator';

// Allowed image MIME types — reject anything else
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

// Allowed upload folders
const ALLOWED_FOLDERS = ['products', 'stores', 'categories'] as const;

export class GetUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_FOLDERS, {
    message: `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`,
  })
  folder: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_TYPES, {
    message: `contentType must be one of: ${ALLOWED_TYPES.join(', ')}`,
  })
  contentType: string;
}
