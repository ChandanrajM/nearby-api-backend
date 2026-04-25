import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { store: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addToCart(userId: string, productId: string, quantity: number = 1, clear: boolean = false) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    });

    if (!product) throw new NotFoundException('Product not found');

    const currentCart = await this.getCart(userId);
    
    // Single-store enforcement
    if (currentCart.length > 0) {
      const existingStoreId = currentCart[0].product.storeId;
      if (existingStoreId !== product.storeId) {
        if (clear) {
          await this.prisma.cartItem.deleteMany({ where: { userId } });
        } else {
          throw new BadRequestException('Cart contains items from another store. Pass clear=true to replace.');
        }
      }
    }

    // Upsert logic
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity
      },
      include: { product: true }
    });
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.userId !== userId) throw new NotFoundException('Cart item not found');

    if (quantity <= 0) {
      return this.prisma.cartItem.delete({ where: { id: cartItemId } });
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.userId !== userId) throw new NotFoundException('Cart item not found');
    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
