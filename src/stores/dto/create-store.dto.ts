import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MinLength(2,  { message: 'Store name must be at least 2 characters' })
  @MaxLength(100,{ message: 'Store name cannot exceed 100 characters' })
  name: string;

  @IsNumber({}, { message: 'lat must be a number' })
  @Min(-90,  { message: 'lat must be >= -90' })
  @Max(90,   { message: 'lat must be <= 90' })
  lat: number;

  @IsNumber({}, { message: 'lng must be a number' })
  @Min(-180, { message: 'lng must be >= -180' })
  @Max(180,  { message: 'lng must be <= 180' })
  lng: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Address cannot exceed 300 characters' })
  address?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s\-]{7,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;
}
