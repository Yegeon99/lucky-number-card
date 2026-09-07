import "server-only";
import { createFileBackend } from "./file";
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
  return (backend ??= isRedisConfigured() ? createRedisBackend() : createFileBackend());
}

/** 지금 어떤 백엔드를 쓰는지 (관리 화면 표시용) */
export function storeKind(): "redis" | "file" {
  return isRedisConfigured() ? "redis" : "file";
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
