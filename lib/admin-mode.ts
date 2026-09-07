"use client";

/**
 * 관리자 모드 (이 기기의 브라우저에만 저장).
 * 켜면: 첫 화면 카드에 럭키/의미 힌트 점이 보이고,
 *       카드 확인이 안 되는 상태에서도 함께 찍기를 열 수 있다 (프레임 검수용).
 * 정품 판정, 도감 등록, 럭키 혜택에는 아무 영향이 없다.
 */
const KEY = "lnc.adminMode";
const LEGACY_KEY = "lnc.demoHints";

export function isAdminMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export function setAdminMode(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // 무시
  }
}

/**
 * 카드 식별자에서 디자인과 일련번호를 읽는다. 예: bm-choom-ruka-0320 -> { designId: "ruka", serial: "0320" }
 * 관리자 모드에서 카드 확인 없이 함께 찍기를 열 때만 쓴다.
 */
export function parseCardId(cardId: string, designIds: string[]): { designId: string; serial: string } | null {
  const parts = cardId.split("-");
  if (parts.length < 2) return null;
  const serial = parts[parts.length - 1];
  const design = designIds.find((d) => cardId.includes(`-${d}-`));
  if (!design || !/^\d{3,}$/.test(serial)) return null;
  return { designId: design, serial };
}
