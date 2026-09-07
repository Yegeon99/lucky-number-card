import type { Registration } from "./types";

/** 같은 기기의 재확인을 1회로 묶는 시간. 뒤로가기와 새로고침이 횟수를 부풀리지 않게 한다. */
export const REVISIT_WINDOW_MS = 30 * 60 * 1000;

/**
 * 확인 1건을 등록 상태에 반영한다. 순수 함수라 테스트하기 쉽다.
 * - 등록 없음: 이 기기를 첫 등록자로 저장, 횟수 1.
 * - 같은 기기, 마지막 확인에서 30분 안: 횟수 유지.
 * - 그 외: 횟수 +1, 마지막 확인 시각 갱신.
 */
export function applyVisit(
  current: Registration | null,
  cardId: string,
  deviceToken: string,
  now: Date,
): { registration: Registration; created: boolean } {
  const nowIso = now.toISOString();
  if (!current) {
    return {
      registration: { cardId, deviceToken, registeredAt: nowIso, viewCount: 1, lastViewedAt: nowIso },
      created: true,
    };
  }
  const sameDevice = current.deviceToken === deviceToken;
  const sinceLast = now.getTime() - new Date(current.lastViewedAt).getTime();
  if (sameDevice && sinceLast >= 0 && sinceLast < REVISIT_WINDOW_MS) {
    return { registration: current, created: false };
  }
  return {
    registration: { ...current, viewCount: current.viewCount + 1, lastViewedAt: nowIso },
    created: false,
  };
}
