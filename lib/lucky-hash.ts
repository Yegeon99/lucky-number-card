import "server-only";
import { createHash } from "node:crypto";
import { getLuckyConfig, type LuckyNumber } from "@/lib/catalog";

/**
 * 럭키 번호 목록의 사전 공개 해시.
 * 입력: "디자인식별자:일련번호:등급" 을 한 줄씩, 사전순 정렬 후 줄바꿈(\n)으로 이어 붙인 UTF-8 문자열.
 * 같은 목록으로 다시 계산하면 항상 같은 값이 나온다. 이벤트 종료 후 원본 목록을 공개해 대조한다.
 */
export function luckyListCanonical(numbers: LuckyNumber[] = getLuckyConfig().numbers): string {
  return numbers
    .map((n) => `${n.designId}:${n.serial}:${n.grade}`)
    .sort()
    .join("\n");
}

export function luckyListHash(numbers: LuckyNumber[] = getLuckyConfig().numbers): string {
  return createHash("sha256").update(luckyListCanonical(numbers), "utf8").digest("hex");
}
