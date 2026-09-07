import { Redis } from "@upstash/redis";
import type { Registration, StoreBackend } from "./types";

/**
 * Upstash Redis 백엔드 (Vercel 마켓플레이스 `vercel integration add upstash`).
 * 배포 환경은 파일을 쓸 수 없으므로 UPSTASH_REDIS_REST_URL 이 있으면 이 백엔드를 쓴다.
 * 키: lnc:reg:<cardId> 에 등록 1건(JSON), lnc:reg:index 에 카드 식별자 집합.
 */
const PREFIX = "lnc:reg:";
const INDEX = "lnc:reg:index";

/**
 * Vercel 마켓플레이스 Upstash 연동은 KV_REST_API_URL / KV_REST_API_TOKEN 이름으로,
 * Upstash 콘솔에서 직접 만들면 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 이름으로 들어온다. 둘 다 받는다.
 */
export function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isRedisConfigured(): boolean {
  return redisCredentials() !== null;
}

export function createRedisBackend(): StoreBackend {
  let client: Redis | null = null;
  const redis = () => {
    if (!client) {
      const cred = redisCredentials();
      if (!cred) throw new Error("Redis 환경 변수가 없습니다");
      client = new Redis(cred);
    }
    return client;
  };

  return {
    async get(cardId) {
      return (await redis().get<Registration>(PREFIX + cardId)) ?? null;
    },
    async list() {
      const ids = await redis().smembers(INDEX);
      if (ids.length === 0) return [];
      const rows = await redis().mget<(Registration | null)[]>(...ids.map((id) => PREFIX + id));
      return rows.filter((r): r is Registration => Boolean(r));
    },
    async mutate(cardId, fn) {
      // 데모 규모에서는 카드 1건 단위 낙관적 갱신으로 충분하다.
      const current = (await redis().get<Registration>(PREFIX + cardId)) ?? null;
      const { next, result } = await fn(current);
      if (next) {
        await redis().set(PREFIX + cardId, next);
        await redis().sadd(INDEX, cardId);
      } else {
        await redis().del(PREFIX + cardId);
        await redis().srem(INDEX, cardId);
      }
      return result;
    },
    async reset() {
      const ids = await redis().smembers(INDEX);
      if (ids.length > 0) await redis().del(...ids.map((id) => PREFIX + id));
      await redis().del(INDEX);
    },
  };
}
