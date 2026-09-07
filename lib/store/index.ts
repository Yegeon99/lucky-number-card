import "server-only";
import { createFileBackend } from "./file";
import { createMemoryBackend } from "./memory";
import { createRedisBackend, isRedisConfigured } from "./redis";
import type { Registration, StoreBackend } from "./types";
import { applyVisit } from "./visit";

export type { Registration } from "./types";

/**
 * 서버 저장 모듈.
 * 배포(Vercel)에서는 Upstash Redis, 로컬에서는 JSON 파일을 쓴다. 화면 코드는 이 파일의 함수만 부른다.
 */
let backend: StoreBackend | null = null;
function store(): StoreBackend {
  if (!backend) {
    const kind = storeKind();
    backend = kind === "redis" ? createRedisBackend() : kind === "memory" ? createMemoryBackend() : createFileBackend();
    if (kind === "memory") {
      console.warn("[store] Redis 미설정: 등록 상태를 메모리에만 둡니다. 인스턴스가 바뀌면 초기화됩니다. `vercel integration add upstash/upstash-kv` 로 연결하세요.");
    }
  }
  return backend;
}

/**
 * 지금 어떤 백엔드를 쓰는지.
 * redis: Upstash 환경 변수 있음. file: 로컬. memory: 배포 환경(파일 쓰기 불가)인데 Redis 가 아직 없을 때의 임시 대체.
 */
export function storeKind(): "redis" | "file" | "memory" {
  if (isRedisConfigured()) return "redis";
  if (process.env.VERCEL) return "memory";
  return "file";
}

export async function getRegistration(cardId: string): Promise<Registration | null> {
  return store().get(cardId);
}

export async function listRegistrations(): Promise<Registration[]> {
  return store().list();
}

/**
 * 확인 요청 1건을 기록한다.
 * 등록이 없으면 이 기기를 첫 등록자로 저장하고, 있으면 확인 횟수를 올린다.
 * 같은 기기가 짧은 시간 안에 다시 열면(뒤로가기, 새로고침) 횟수를 올리지 않는다.
 * 반환값의 created 가 true 이면 이 요청이 첫 등록이다.
 */
export async function recordVisit(
  cardId: string,
  deviceToken: string,
  now: Date = new Date(),
): Promise<{ registration: Registration; created: boolean }> {
  return store().mutate(cardId, async (current) => {
    const out = applyVisit(current, cardId, deviceToken, now);
    return { next: out.registration, result: out };
  });
}

/** 데모 초기화: 모든 등록 상태 해제. */
export async function resetAll(): Promise<void> {
  return store().reset();
}

/** 카드 번호가 바뀌어 식별자가 달라졌을 때 이전 등록 기록을 지운다. */
export async function deleteRegistration(cardId: string): Promise<void> {
  await store().mutate(cardId, async () => ({ next: null, result: undefined }));
}
