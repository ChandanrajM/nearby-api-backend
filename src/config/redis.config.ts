import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  ttl:   parseInt(process.env.CACHE_TTL_SECONDS ?? '300', 10),
}));
