import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService }  from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CurrentUser }      from '../common/decorators/current-user.decorator';
import { User }             from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()        dto:  CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.products.create(dto, user);
  }

  @Get()
  findByStore(
    @Query('storeId') storeId: string,
    @CurrentUser()    user:    User,
  ) {
    return this.products.findByStore(storeId, user);
  }

  @Get(':id')
  findOne(
    @Param('id')   id:    string,
    @CurrentUser() user: User,
  ) {
    return this.products.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id')                id:    string,
    @Body()                     dto:  UpdateProductDto,
    @CurrentUser()              user: User,
  ) {
    return this.products.update(id, dto, user);
  }

  @Patch(':id/toggle')
  toggle(
    @Param('id')                id:    string,
    @CurrentUser()              user: User,
  ) {
    return this.products.toggleAvailability(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id')                id:    string,
    @CurrentUser()              user: User,
  ) {
    return this.products.remove(id, user);
  }
}
