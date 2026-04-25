import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public }            from '../common/decorators/public.decorator';
import { CurrentUser }       from '../common/decorators/current-user.decorator';
import { User }              from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categories.findOne(id);
  }

  @Public()
  @Get(':id/products')
  findProducts(@Param('id') id: string) {
    return this.categories.findProductsByCategory(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()        dto:  CreateCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.categories.create(dto, user);
  }
}
