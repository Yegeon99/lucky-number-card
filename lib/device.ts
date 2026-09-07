"use client";

/**
 * 기기 토큰. 첫 방문 시 브라우저가 임의로 만들어 저장한다.
 * 첫 등록자 판정에만 쓰이며 개인정보가 아니다.
 */
const KEY = "lnc.device";

export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const token = makeToken();
    window.localStorage.setItem(KEY, token);
    return token;
  } catch {
    return makeToken();
  }
}

function makeToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
