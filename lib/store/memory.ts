import type { Registration, StoreBackend } from "./types";

/**
 * 메모리 백엔드. 배포 환경에서 Redis 가 아직 연결되지 않았을 때의 임시 대체.
 * 서버 인스턴스가 바뀌거나 재시작되면 비워진다. 시연 전에는 반드시 Redis 를 연결한다.
 */
export function createMemoryBackend(): StoreBackend {
  const map = new Map<string, Registration>();
  let queue: Promise<unknown> = Promise.resolve();
  function serialize<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next;
  }
  return {
    async get(cardId) {
      return map.get(cardId) ?? null;
    },
    async list() {
      return [...map.values()];
    },
    mutate(cardId, fn) {
      return serialize(async () => {
        const { next, result } = await fn(map.get(cardId) ?? null);
        if (next) map.set(cardId, next);
        else map.delete(cardId);
        return result;
      });
    },
    async reset() {
      map.clear();
    },
  };
}
