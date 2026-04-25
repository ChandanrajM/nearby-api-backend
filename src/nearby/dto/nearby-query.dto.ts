import {
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'lat must be a number' })
  @Min(-90,  { message: 'lat must be >= -90' })
  @Max(90,   { message: 'lat must be <= 90' })
  lat: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'lng must be a number' })
  @Min(-180, { message: 'lng must be >= -180' })
  @Max(180,  { message: 'lng must be <= 180' })
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100,    { message: 'radius must be at least 100 metres' })
  @Max(50000,  { message: 'radius cannot exceed 50km' })
  radius?: number = 5000;

  @IsOptional()
  @IsString({ message: 'categoryId must be a valid string' })
  categoryId?: string;

  @IsOptional()
  @IsIn(['distance', 'price_asc', 'price_desc'], {
    message: 'sortBy must be: distance | price_asc | price_desc',
  })
  sortBy?: 'distance' | 'price_asc' | 'price_desc' = 'distance';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50, { message: 'limit cannot exceed 50 per page' })
  limit?: number = 20;
}
