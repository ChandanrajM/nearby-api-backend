import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService }    from '../prisma/prisma.service';
import { R2Service }        from '../upload/r2.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NearbyService }    from '../nearby/nearby.service';
import { User }             from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2:     R2Service,
    private readonly nearby: NearbyService,
  ) {}

  async create(dto: CreateProductDto, user: User) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store ${dto.storeId} not found`);
    }

    if (store.ownerId !== user.id) {
      throw new ForbiddenException('You can only add products to your own stores');
    }

    if (!store.isActive) {
      throw new BadRequestException('Cannot add products to an inactive store. Activate the store first.');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found. Fetch valid categories from GET /categories`);
    }

    const product = await this.prisma.product.create({
      data: {
        name:        dto.name,
        description: dto.description  ?? null,
        price:       dto.price,
        imageUrl:    dto.imageUrl,
        imageKey:    dto.imageKey,
        isAvailable: dto.isAvailable  ?? true,
        storeId:     dto.storeId,
        categoryId:  dto.categoryId,
      },
      include: {
        store:    {
          select: {
            id: true, name: true, latitude: true,
            longitude: true, phone: true, addressLine: true,
          },
        },
        category: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Product created: ${product.id} in store: ${store.id}`);
    await this.nearby.invalidateAreaCache(store.latitude, store.longitude);
    return this.formatProduct(product);
  }

  async findByStore(storeId: string, user: User) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    if (store.ownerId !== user.id) {
      throw new ForbiddenException('You can only view products of your own stores');
    }

    const products = await this.prisma.product.findMany({
      where:   { storeId },
      include: {
        category: { select: { id: true, name: true } },
        store:    {
          select: {
            id: true, name: true, latitude: true,
            longitude: true, phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(this.formatProduct);
  }

  async findOne(productId: string, user: User) {
    const product = await this.prisma.product.findUnique({
      where:   { id: productId },
      include: {
        store:    {
          select: {
            id: true, name: true, latitude: true,
            longitude: true, phone: true, ownerId: true,
          },
        },
        category: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.store.ownerId !== user.id) {
      throw new ForbiddenException('You can only view products in your own stores');
    }

    return this.formatProduct(product);
  }

  async update(productId: string, dto: UpdateProductDto, user: User) {
    const product = await this.prisma.product.findUnique({
      where:   { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.store.ownerId !== user.id) {
      throw new ForbiddenException('You can only update products in your own stores');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    let oldImageKey: string | null = null;
    if (dto.imageKey && dto.imageKey !== product.imageKey) {
      oldImageKey = product.imageKey;
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data:  {
        ...(dto.name        !== undefined && { name:        dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price       !== undefined && { price:       dto.price }),
        ...(dto.imageUrl    !== undefined && { imageUrl:    dto.imageUrl }),
        ...(dto.imageKey    !== undefined && { imageKey:    dto.imageKey }),
        ...(dto.categoryId  !== undefined && { categoryId:  dto.categoryId }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      include: {
        store:    {
          select: {
            id: true, name: true, latitude: true,
            longitude: true, phone: true,
          },
        },
        category: { select: { id: true, name: true } },
      },
    });

    if (oldImageKey) {
      try {
        await this.r2.deleteFile(oldImageKey);
        this.logger.log(`Deleted old image from R2: ${oldImageKey}`);
      } catch (err) {
        this.logger.warn(`Failed to delete old image ${oldImageKey}: ${err.message}`);
      }
    }

    this.logger.log(`Product updated: ${productId} by user: ${user.id}`);
    await this.nearby.invalidateAreaCache(product.store.latitude, product.store.longitude);
    return this.formatProduct(updated);
  }

  async remove(productId: string, user: User) {
    const product = await this.prisma.product.findUnique({
      where:   { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.store.ownerId !== user.id) {
      throw new ForbiddenException('You can only delete products in your own stores');
    }

    await this.prisma.product.delete({ where: { id: productId } });

    if (product.imageKey) {
      try {
        await this.r2.deleteFile(product.imageKey);
        this.logger.log(`Deleted image from R2: ${product.imageKey}`);
      } catch (err) {
        this.logger.warn(`Product deleted but R2 cleanup failed for key ${product.imageKey}: ${err.message}`);
      }
    }

    this.logger.log(`Product deleted: ${productId} by user: ${user.id}`);
    await this.nearby.invalidateAreaCache(product.store.latitude, product.store.longitude);

    return {
      message:   'Product deleted successfully',
      productId,
    };
  }

  async toggleAvailability(productId: string, user: User) {
    const product = await this.prisma.product.findUnique({
      where:   { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.store.ownerId !== user.id) {
      throw new ForbiddenException('You can only toggle your own products');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data:  { isAvailable: !product.isAvailable },
      include: {
        store:    { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Product ${productId} availability toggled to: ${updated.isAvailable}`);
    await this.nearby.invalidateAreaCache(product.store.latitude, product.store.longitude);
    return this.formatProduct(updated);
  }

  private formatProduct(product: any) {
    return {
      id:          product.id,
      name:        product.name,
      description: product.description,
      price:       product.price,
      imageUrl:    product.imageUrl,
      imageKey:    product.imageKey,
      isAvailable: product.isAvailable,
      store:       product.store
        ? {
            id:      product.store.id,
            name:    product.store.name,
            lat:     product.store.latitude,
            lng:     product.store.longitude,
            phone:   product.store.phone,
            address: product.store.addressLine,
          }
        : undefined,
      category:    product.category
        ? { id: product.category.id, name: product.category.name }
        : undefined,
      createdAt:   product.createdAt,
      updatedAt:   product.updatedAt,
    };
  }
}
