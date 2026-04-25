import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService }  from '../prisma/prisma.service';
import { CacheService }   from '../cache/cache.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import * as ngeohash      from 'ngeohash';

interface NearbyProductRaw {
  product_id:       string;
  product_name:     string;
  description:      string | null;
  price:            number;
  image_url:        string;
  is_available:     boolean;
  store_id:         string;
  store_name:       string;
  store_phone:      string | null;
  store_address:    string | null;
  store_lat:        number;
  store_lng:        number;
  category_id:      string;
  category_name:    string;
  distance_metres:  number;
  created_at:       Date;
}

@Injectable()
export class NearbyService {
  private readonly logger = new Logger(NearbyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache:  CacheService,
  ) {}

  async getNearbyProducts(query: NearbyQueryDto) {
    const {
      lat, lng,
      radius     = 5000,
      categoryId,
      sortBy     = 'distance',
      page       = 1,
      limit      = 20,
    } = query;

    const geoHash   = ngeohash.encode(lat, lng, 5);
    const cacheKey  = this.buildCacheKey(
      geoHash, radius, categoryId, sortBy, page, limit,
    );

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT  → ${cacheKey}`);
      return { ...cached, fromCache: true };
    }

    this.logger.log(`Cache MISS → ${cacheKey}`);

    const offset = (page - 1) * limit;
    const orderClause = this.buildOrderClause(sortBy);

    const categoryFilter = categoryId
      ? `AND p.category_id = '${categoryId}'::uuid`
      : '';

    const rawResults = await this.prisma.$queryRawUnsafe<NearbyProductRaw[]>(`
      SELECT
        p.id            AS product_id,
        p.name          AS product_name,
        p.description   AS description,
        p.price         AS price,
        p.image_url     AS image_url,
        p.is_available  AS is_available,
        s.id            AS store_id,
        s.name          AS store_name,
        s.phone         AS store_phone,
        s.address       AS store_address,
        s.latitude      AS store_lat,
        s.longitude     AS store_lng,
        c.id            AS category_id,
        c.name          AS category_name,
        p.created_at    AS created_at,

        ROUND(
          ST_Distance(
            s.location::geography,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          )
        )               AS distance_metres

      FROM products p
      INNER JOIN stores    s ON p.store_id    = s.id
      INNER JOIN categories c ON p.category_id = c.id

      WHERE
        ST_DWithin(
          s.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
        AND s.is_active   = true
        AND p.is_available = true
        ${categoryFilter}

      ${orderClause}

      LIMIT  $4
      OFFSET $5
    `,
      lat,
      lng,
      radius,
      limit,
      offset,
    );

    const countResult = await this.prisma.$queryRawUnsafe<[{ total: bigint }]>(`
      SELECT COUNT(*) AS total
      FROM products p
      INNER JOIN stores s ON p.store_id = s.id
      WHERE
        ST_DWithin(
          s.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
        AND s.is_active    = true
        AND p.is_available = true
        ${categoryFilter}
    `,
      lat, lng, radius,
    );

    const total      = Number(countResult[0]?.total ?? 0);
    const totalPages = Math.ceil(total / limit);

    const products = rawResults.map(row => this.formatProduct(row));

    const response = {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      query: {
        lat,
        lng,
        radiusMetres: radius,
        radiusKm:     (radius / 1000).toFixed(1),
        categoryId:   categoryId ?? null,
        sortBy,
      },
      fromCache: false,
    };

    if (products.length > 0) {
      await this.cache.set(cacheKey, response);
      this.logger.log(
        `Cached ${products.length} products → ${cacheKey} (TTL: 5min)`,
      );
    }

    return response;
  }

  async invalidateAreaCache(storeLat: number, storeLng: number): Promise<void> {
    const geoHash = ngeohash.encode(storeLat, storeLng, 5);

    const neighbours = ngeohash.neighbors(geoHash);
    const allCells   = [geoHash, ...Object.values(neighbours)];

    for (const cell of allCells) {
      await this.cache.deleteByPattern(`nearby:${cell}:*`);
    }

    this.logger.log(
      `Cache invalidated for geohash ${geoHash} and 8 neighbours`,
    );
  }

  async healthCheck() {
    const redisAlive = await this.cache.ping();
    return {
      status:    'ok',
      redis:     redisAlive ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    };
  }

  private buildCacheKey(
    geoHash:    string,
    radius:     number,
    categoryId: string | undefined,
    sortBy:     string,
    page:       number,
    limit:      number,
  ): string {
    const cat = categoryId ?? 'all';
    return `nearby:${geoHash}:${radius}:${cat}:${sortBy}:${page}:${limit}`;
  }

  private buildOrderClause(sortBy: string): string {
    switch (sortBy) {
      case 'price_asc':
        return 'ORDER BY p.price ASC,   distance_metres ASC';
      case 'price_desc':
        return 'ORDER BY p.price DESC,  distance_metres ASC';
      case 'distance':
      default:
        return 'ORDER BY distance_metres ASC, p.created_at DESC';
    }
  }

  private formatProduct(row: NearbyProductRaw) {
    return {
      id:          row.product_id,
      name:        row.product_name,
      description: row.description,
      price:       Number(row.price),
      imageUrl:    row.image_url,
      isAvailable: row.is_available,
      store: {
        id:      row.store_id,
        name:    row.store_name,
        phone:   row.store_phone,
        address: row.store_address,
        lat:     Number(row.store_lat),
        lng:     Number(row.store_lng),
      },
      category: {
        id:   row.category_id,
        name: row.category_name,
      },
      distance: {
        metres:     Number(row.distance_metres),
        kilometres: (Number(row.distance_metres) / 1000).toFixed(2),
        display:    this.formatDistance(Number(row.distance_metres)),
      },
      createdAt: row.created_at,
    };
  }

  private formatDistance(metres: number): string {
    if (metres < 1000) {
      return `${Math.round(metres)}m`;
    }
    return `${(metres / 1000).toFixed(1)}km`;
  }
}
