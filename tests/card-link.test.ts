import { describe, expect, it } from "vitest";
import { cardHref } from "@/lib/card-link";

describe("cardHref", () => {
  it("토큰이 있으면 카드 홈 주소에 붙인다", () => {
    expect(cardHref("bm-choom-ruka-0320", "K7M2QX9RA4TB")).toBe("/c/bm-choom-ruka-0320?t=K7M2QX9RA4TB");
  });
  it("토큰을 모르면 null (호출한 쪽이 첫 화면으로 보낸다)", () => {
    expect(cardHref("bm-choom-ruka-0320", null)).toBeNull();
    expect(cardHref("bm-choom-ruka-0320", undefined)).toBeNull();
    expect(cardHref(null, "K7M2QX9RA4TB")).toBeNull();
  });
});
