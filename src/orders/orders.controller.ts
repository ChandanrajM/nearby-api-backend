import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('api/v1/orders')
@UseGuards(FirebaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(
    @Req() req,
    @Body('addressId') addressId: string,
    @Body('paymentMethod') paymentMethod: string
  ) {
    return this.ordersService.checkout(req.user.uid, addressId, paymentMethod);
  }

  @Get()
  getOrders(@Req() req) {
    return this.ordersService.getOrders(req.user.uid);
  }
}
