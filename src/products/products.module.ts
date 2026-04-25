import { Module }             from '@nestjs/common';
import { ProductsService }    from './products.service';
import { ProductsController } from './products.controller';
import { UploadModule }       from '../upload/upload.module';
import { NearbyModule }       from '../nearby/nearby.module';

@Module({
  imports:     [UploadModule, NearbyModule],
  controllers: [ProductsController],
  providers:   [ProductsService],
  exports:     [ProductsService],
})
export class ProductsModule {}
