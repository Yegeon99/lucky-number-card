import { describe, expect, it } from "vitest";
import { parseCardId } from "@/lib/admin-mode";

const designs = ["ruka", "pharita", "asa", "ahyeon", "rora", "chiquita", "group"];

describe("parseCardId (관리자 모드에서 확인 없이 프레임 열기)", () => {
  it("카드 식별자에서 디자인과 번호를 읽는다", () => {
    expect(parseCardId("bm-choom-ruka-0320", designs)).toEqual({ designId: "ruka", serial: "0320" });
    expect(parseCardId("bm-choom-group-0504", designs)).toEqual({ designId: "group", serial: "0504" });
  });
  it("모르는 디자인이나 번호 형식이 아니면 null", () => {
    expect(parseCardId("bm-choom-unknown-9999", designs)).toBeNull();
    expect(parseCardId("bm-choom-ruka-abc", designs)).toBeNull();
    expect(parseCardId("nonsense", designs)).toBeNull();
  });
});
