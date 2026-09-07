"use client";

import type { CardPublicInfo } from "@/lib/verify/types";

/**
 * 카드 홈에서 함께 찍기 화면으로 넘길 때 쓰는 현재 카드 정보.
 * 같은 탭 안에서만 유지되며 사진은 담지 않는다.
 */
export type SessionCard = {
  card: CardPublicInfo;
  /** 카드 홈으로 돌아갈 때 붙일 토큰. 없으면 카드 홈이 열리지 않는다. */
  tagToken: string | null;
  luckyUnlocked: boolean;
  status: "verified" | "other_device";
};

const KEY = "lnc.currentCard";

export function saveSessionCard(value: SessionCard) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // 무시
  }
}

export function loadSessionCard(): SessionCard | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionCard) : null;
  } catch {
    return null;
  }
}
