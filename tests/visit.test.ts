import { describe, expect, it } from "vitest";
import { applyVisit, REVISIT_WINDOW_MS } from "@/lib/store/visit";

const t0 = new Date("2026-09-07T10:00:00Z");
const later = (ms: number) => new Date(t0.getTime() + ms);

describe("applyVisit (확인 횟수 규칙)", () => {
  it("첫 확인은 이 기기를 첫 등록자로 저장하고 횟수 1", () => {
    const out = applyVisit(null, "card-a", "dev-1", t0);
    expect(out.created).toBe(true);
    expect(out.registration).toMatchObject({ cardId: "card-a", deviceToken: "dev-1", viewCount: 1 });
  });

  it("같은 기기가 30분 안에 다시 열면 횟수 유지 (뒤로가기, 새로고침)", () => {
    const first = applyVisit(null, "card-a", "dev-1", t0).registration;
    const out = applyVisit(first, "card-a", "dev-1", later(5 * 60 * 1000));
    expect(out.created).toBe(false);
    expect(out.registration.viewCount).toBe(1);
  });

  it("같은 기기라도 30분이 지나면 횟수 +1", () => {
    const first = applyVisit(null, "card-a", "dev-1", t0).registration;
    const out = applyVisit(first, "card-a", "dev-1", later(REVISIT_WINDOW_MS + 1));
    expect(out.registration.viewCount).toBe(2);
  });

  it("다른 기기는 바로 횟수 +1, 첫 등록자는 바뀌지 않음", () => {
    const first = applyVisit(null, "card-a", "dev-1", t0).registration;
    const out = applyVisit(first, "card-a", "dev-2", later(1000));
    expect(out.registration.viewCount).toBe(2);
    expect(out.registration.deviceToken).toBe("dev-1");
  });
});
