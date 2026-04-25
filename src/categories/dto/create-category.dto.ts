import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(2,   { message: 'Name must be at least 2 characters' })
  @MaxLength(50,  { message: 'Name cannot exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsUrl({}, { message: 'iconUrl must be a valid URL' })
  iconUrl?: string;
}
