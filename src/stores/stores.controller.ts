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
} from '@nestjs/common';
import { StoresService }  from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser }    from '../common/decorators/current-user.decorator';
import { User }           from '@prisma/client';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()        dto:  CreateStoreDto,
    @CurrentUser() user: User,
  ) {
    return this.stores.create(dto, user);
  }

  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.stores.findMyStores(user);
  }

  @Get(':id')
  findOne(
    @Param('id')   id:    string,
    @CurrentUser() user: User,
  ) {
    return this.stores.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id')                id:    string,
    @Body()                     dto:  UpdateStoreDto,
    @CurrentUser()              user: User,
  ) {
    return this.stores.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id')                id:    string,
    @CurrentUser()              user: User,
  ) {
    return this.stores.remove(id, user);
  }
}
