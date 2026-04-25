import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsBoolean,
  IsUrl,
  MaxLength,
  MinLength,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(2,   { message: 'Name must be at least 2 characters' })
  @MaxLength(150, { message: 'Name cannot exceed 150 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be greater than 0' })
  @Max(1000000, { message: 'Price cannot exceed ₹10,00,000' })
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'imageUrl is required' })
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'imageKey is required' })
  imageKey: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
