import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService }  from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User, Role }     from '@prisma/client';

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStoreDto, owner: User) {
    const existing = await this.prisma.store.findFirst({
      where: {
        ownerId: owner.id,
        name:    { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        `You already have a store named "${dto.name}". ` +
        `Please choose a different name.`,
      );
    }

    const store = await this.prisma.store.create({
      data: {
        name:    dto.name,
        lat:     dto.lat,
        lng:     dto.lng,
        address: dto.address ?? null,
        phone:   dto.phone   ?? null,
        ownerId: owner.id,
        geohash: "todo-geohash", // Schema requires geohash, we can mock or generate it later
        city: "todo-city",
        state: "todo-state",
        pincode: "todo-pincode",
        addressLine: dto.address ?? "todo-address"
      },
      include: {
        owner:    { select: { id: true, name: true, email: true } },
        products: { select: { id: true } },
        _count:   { select: { products: true } },
      },
    });

    if (owner.role !== Role.SELLER) {
      await this.prisma.user.update({
        where: { id: owner.id },
        data:  { role: Role.SELLER },
      });
      this.logger.log(`User ${owner.id} promoted to SELLER`);
    }

    this.logger.log(`Store created: ${store.id} by user: ${owner.id}`);
    return this.formatStore(store);
  }

  async findMyStores(owner: User) {
    const stores = await this.prisma.store.findMany({
      where:   { ownerId: owner.id },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stores.map(this.formatStore);
  }

  async findOne(storeId: string, requestingUser: User) {
    const store = await this.prisma.store.findUnique({
      where:   { id: storeId },
      include: {
        owner:  { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    if (store.ownerId !== requestingUser.id) {
      throw new ForbiddenException('You can only view your own stores');
    }

    return this.formatStore(store);
  }

  async update(storeId: string, dto: UpdateStoreDto, requestingUser: User) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    if (store.ownerId !== requestingUser.id) {
      throw new ForbiddenException('You can only update your own stores');
    }

    if (dto.name && dto.name !== store.name) {
      const nameConflict = await this.prisma.store.findFirst({
        where: {
          ownerId: requestingUser.id,
          name:    { equals: dto.name, mode: 'insensitive' },
          id:      { not: storeId },
        },
      });

      if (nameConflict) {
        throw new ConflictException(`You already have another store named "${dto.name}"`);
      }
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data:  {
        ...(dto.name     !== undefined && { name:     dto.name }),
        ...(dto.lat      !== undefined && { lat:      dto.lat }),
        ...(dto.lng      !== undefined && { lng:      dto.lng }),
        ...(dto.address  !== undefined && { addressLine: dto.address }),
        ...(dto.phone    !== undefined && { phone:    dto.phone }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Store updated: ${storeId} by user: ${requestingUser.id}`);
    return this.formatStore(updated);
  }

  async remove(storeId: string, requestingUser: User) {
    const store = await this.prisma.store.findUnique({
      where:   { id: storeId },
      include: { _count: { select: { products: true } } },
    });

    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    if (store.ownerId !== requestingUser.id) {
      throw new ForbiddenException('You can only delete your own stores');
    }

    if (store._count.products > 0) {
      this.logger.warn(`Deleting store ${storeId} which has ${store._count.products} products — cascade delete triggered`);
    }

    await this.prisma.store.delete({ where: { id: storeId } });

    const remainingStores = await this.prisma.store.count({
      where: { ownerId: requestingUser.id },
    });

    if (remainingStores === 0) {
      await this.prisma.user.update({
        where: { id: requestingUser.id },
        data:  { role: Role.BUYER },
      });
      this.logger.log(`User ${requestingUser.id} downgraded to BUYER (no remaining stores)`);
    }

    this.logger.log(`Store deleted: ${storeId} by user: ${requestingUser.id}`);

    return { message: 'Store deleted successfully', storeId };
  }

  private formatStore(store: any) {
    return {
      id:           store.id,
      name:         store.name,
      lat:          store.lat,
      lng:          store.lng,
      address:      store.addressLine || store.address,
      phone:        store.phone,
      isActive:     store.isActive,
      productCount: store._count?.products ?? 0,
      owner:        store.owner ?? undefined,
      createdAt:    store.createdAt,
      updatedAt:    store.updatedAt,
    };
  }
}
