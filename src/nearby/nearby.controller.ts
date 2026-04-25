import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { NearbyService }  from './nearby.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { Public }         from '../common/decorators/public.decorator';

@Public()
@Controller('products/nearby')
export class NearbyController {
  constructor(private readonly nearby: NearbyService) {}

  @Get()
  getNearby(@Query() query: NearbyQueryDto) {
    return this.nearby.getNearbyProducts(query);
  }

  @Get('health')
  health() {
    return this.nearby.healthCheck();
  }
}
