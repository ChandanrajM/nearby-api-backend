import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis }         from '@upstash/redis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;
  private readonly ttl: number;

  constructor(private readonly config: ConfigService) {
    this.ttl = this.config.get<number>('redis.ttl') ?? 300;
  }

  onModuleInit() {
    const url   = this.config.get<string>('redis.url');
    const token = this.config.get<string>('redis.token');

    if (!url || !token) {
      this.logger.warn(
        '⚠️  Upstash Redis env vars missing — caching disabled. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
      );
      return;
    }

    this.client = new Redis({ url, token });
    this.logger.log('✅ Upstash Redis connected');
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const raw = await this.client.get<string>(key);
      if (!raw) return null;

      if (typeof raw === 'string') {
        return JSON.parse(raw) as T;
      }
      return raw as unknown as T;
    } catch (err) {
      this.logger.warn(`Cache GET error for key "${key}": ${err.message}`);
      return null;
    }
  }

  async set(
    key:   string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.setex(
        key,
        ttlSeconds ?? this.ttl,
        JSON.stringify(value),
      );
    } catch (err) {
      this.logger.warn(`Cache SET error for key "${key}": ${err.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL error for key "${key}": ${err.message}`);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    if (!this.client) return;

    try {
      let cursor = 0;
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          { match: pattern, count: 100 },
        );
        cursor = parseInt(nextCursor as unknown as string, 10);

        if (keys.length > 0) {
          await this.client.del(...keys);
          this.logger.log(
            `Deleted ${keys.length} cache keys matching: ${pattern}`,
          );
        }
      } while (cursor !== 0);
    } catch (err) {
      this.logger.warn(
        `Cache pattern delete error for "${pattern}": ${err.message}`,
      );
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
