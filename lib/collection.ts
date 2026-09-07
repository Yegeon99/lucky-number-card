"use client";

import { create } from "zustand";

/**
 * 내 도감. 브라우저 저장소(localStorage)에만 저장한다. 계정 없음.
 */

export type BadgeKind = "lucky" | "meaning" | "none";

export type CollectedCard = {
  cardId: string;
  designId: string;
  setId: string;
  serial: string;
  member: string;
  image: string;
  accent: string;
  badge: BadgeKind;
  meaningLabel?: string;
  registeredAt: string;
  /** 도감에서 카드 홈으로 돌아갈 때 붙일 토큰 */
  tagToken?: string;
};

const KEY = "lnc.collection.v1";

function load(): CollectedCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CollectedCard[]) : [];
  } catch {
    return [];
  }
}

function save(items: CollectedCard[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // 저장 실패는 조용히 넘긴다. 화면 상태는 유지된다.
  }
}

type CollectionState = {
  items: CollectedCard[];
  hydrated: boolean;
  hydrate: () => void;
  add: (card: CollectedCard) => { added: boolean };
  clear: () => void;
  has: (cardId: string) => boolean;
};

export const useCollection = create<CollectionState>((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ items: load(), hydrated: true });
  },
  add: (card) => {
    const items = get().hydrated ? get().items : load();
    if (items.some((c) => c.cardId === card.cardId)) {
      set({ items, hydrated: true });
      return { added: false };
    }
    const next = [...items, card];
    save(next);
    set({ items: next, hydrated: true });
    return { added: true };
  },
  clear: () => {
    save([]);
    try {
      // 세트 완성 축하 연출 기록도 함께 지운다 (도감을 비우면 다시 볼 수 있게).
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("lnc.celebrated."))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // 무시
    }
    set({ items: [], hydrated: true });
  },
  has: (cardId) => get().items.some((c) => c.cardId === cardId),
}));

/** 세트 완성 여부: 세트에 속한 디자인을 모두 보유했는지 */
export function isSetComplete(items: CollectedCard[], setId: string, designIds: string[]): boolean {
  const owned = new Set(items.filter((c) => c.setId === setId).map((c) => c.designId));
  return designIds.every((d) => owned.has(d));
}

/** 이 기기가 럭키 카드를 보유했는지 (금색 테두리 프레임 해금 기준) */
export function hasLuckyCard(items: CollectedCard[]): boolean {
  return items.some((c) => c.badge === "lucky");
}
