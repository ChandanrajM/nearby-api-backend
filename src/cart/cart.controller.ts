import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, ParseBoolPipe, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('cart')
@UseGuards(FirebaseAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart(req.user.uid);
  }

  @Post()
  addToCart(
    @Req() req,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number = 1,
    @Body('clear') clear: boolean = false
  ) {
    return this.cartService.addToCart(req.user.uid, productId, quantity, clear);
  }

  @Patch(':id')
  updateQuantity(
    @Req() req,
    @Param('id') cartItemId: string,
    @Body('quantity') quantity: number
  ) {
    return this.cartService.updateQuantity(req.user.uid, cartItemId, quantity);
  }

  @Delete(':id')
  removeItem(@Req() req, @Param('id') cartItemId: string) {
    return this.cartService.removeItem(req.user.uid, cartItemId);
  }

  @Delete()
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.uid);
  }
}
