import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { StoresModule }      from './stores/stores.module';
import { ProductsModule }    from './products/products.module';
import { CategoriesModule }  from './categories/categories.module';
import { NearbyModule }      from './nearby/nearby.module';
import { ThemesModule }      from './themes/themes.module';
import { CacheModule }       from './cache/cache.module';
import { CartModule }        from './cart/cart.module';
import { AddressesModule }   from './addresses/addresses.module';
import { OrdersModule }      from './orders/orders.module';
import { AppController }     from './app.controller';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';
import firebaseConfig        from './config/firebase.config';
import r2Config              from './config/r2.config';
import redisConfig           from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [firebaseConfig, r2Config, redisConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CacheModule,
    AuthModule,
    UploadModule,
    StoresModule,
    NearbyModule,
    ThemesModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
