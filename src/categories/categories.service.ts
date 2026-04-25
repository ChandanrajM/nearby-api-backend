import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService }       from '../prisma/prisma.service';
import { CreateCategoryDto }   from './dto/create-category.dto';
import { User, Role }      from '@prisma/client';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    return categories.map(this.formatCategory);
  }

  async findOne(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where:   { id: categoryId },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    return this.formatCategory(category);
  }

  async create(dto: CreateCategoryDto, user: User) {
    if (user.role !== Role.SELLER) {
      throw new ForbiddenException('Only store owners can create categories');
    }

    const existing = await this.prisma.category.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await this.prisma.category.create({
      data: {
        name:    dto.name,
        slug:    slug,
        iconUrl: dto.iconUrl ?? null,
      },
      include: { _count: { select: { products: true } } },
    });

    this.logger.log(`Category created: "${category.name}" by user: ${user.id}`);
    return this.formatCategory(category);
  }

  async findProductsByCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        isAvailable: true,
        store: { isActive: true },
      },
      include: {
        store: {
          select: {
            id: true, name: true,
            latitude: true, longitude: true, phone: true,
          },
        },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });

    return {
      category: this.formatCategory(category),
      products: products.map(p => ({
        id:          p.id,
        name:        p.name,
        description: p.description,
        price:       p.price,
        imageUrl:    p.imageUrl,
        isAvailable: p.isAvailable,
        store:       p.store,
        category:    p.category,
        createdAt:   p.createdAt,
      })),
    };
  }

  private formatCategory(category: any) {
    return {
      id:           category.id,
      name:         category.name,
      iconUrl:      category.iconUrl  ?? null,
      productCount: category._count?.products ?? 0,
    };
  }
}
