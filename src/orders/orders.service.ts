import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, addressId: string, paymentMethod: string = 'COD') {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const storeId = cartItems[0].product.storeId;
    
    // Verify address belongs to user
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Invalid address');
    }

    const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const deliveryFee = 40; // Flat fee for now
    const total = subtotal + deliveryFee;

    const order = await this.prisma.order.create({
      data: {
        userId,
        storeId,
        addressId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: paymentMethod as PaymentMethod,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity
          }))
        }
      },
      include: { items: true, store: true }
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { userId } });

    return order;
  }
  
  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, store: true },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
