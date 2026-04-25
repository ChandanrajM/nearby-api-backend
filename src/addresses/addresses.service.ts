import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async createAddress(userId: string, data: any) {
    // Check if first address, make it default
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = count === 0;

    return this.prisma.address.create({
      data: {
        userId,
        ...data,
        isDefault
      }
    });
  }
}
