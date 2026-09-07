import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// 등록 상태는 임시 파일에 쓴다. data/registrations.json 은 건드리지 않는다.
process.env.LNC_STORE_FILE = path.join(mkdtempSync(path.join(tmpdir(), "lnc-")), "registrations.json");
for (const k of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "VERCEL"]) delete process.env[k];

const RUKA = { id: "bm-choom-ruka-0320", token: "K7M2QX9RA4TB" };
const LUCKY = { id: "bm-choom-chiquita-0217", token: "C4NQ7YB3ZH9J" };

let verifyCard: typeof import("@/lib/verify").verifyCard;
beforeAll(async () => {
  ({ verifyCard } = await import("@/lib/verify"));
});

describe("verifyCard (모의 검증 3상태)", () => {
  it("목록에 있는 카드 + 맞는 토큰 = 정품, 첫 등록", async () => {
    const r = await verifyCard({ cardId: RUKA.id, tagToken: RUKA.token, deviceToken: "dev-A" });
    expect(r.status).toBe("verified");
    if (r.status !== "verified") return;
    expect(r.isFirstRegistrant).toBe(true);
    expect(r.justRegistered).toBe(true);
    expect(r.viewCount).toBe(1);
    expect(r.lucky.isLuckyCard).toBe(false);
  });

  it("같은 기기가 다시 열면 정품이지만 첫 등록 연출은 없음", async () => {
    const r = await verifyCard({ cardId: RUKA.id, tagToken: RUKA.token, deviceToken: "dev-A" });
    expect(r.status).toBe("verified");
    if (r.status !== "verified") return;
    expect(r.justRegistered).toBe(false);
    expect(r.viewCount).toBe(1);
  });

  it("다른 기기가 열면 다른 기기 등록. 럭키 확인 잠김", async () => {
    const r = await verifyCard({ cardId: RUKA.id, tagToken: RUKA.token, deviceToken: "dev-B" });
    expect(r.status).toBe("other_device");
    if (r.status !== "other_device") return;
    expect(r.isFirstRegistrant).toBe(false);
    expect(r.lucky.unlocked).toBe(false);
    expect(r.viewCount).toBe(2);
  });

  it("목록에 없는 카드는 확인 불가", async () => {
    const r = await verifyCard({ cardId: "bm-choom-unknown-9999", tagToken: "ZZZZ0000AAAA", deviceToken: "dev-A" });
    expect(r.status).toBe("unverified");
  });

  it("토큰이 없거나 형식이 틀리면 확인 불가", async () => {
    expect((await verifyCard({ cardId: RUKA.id, tagToken: null, deviceToken: "dev-A" })).status).toBe("unverified");
    expect((await verifyCard({ cardId: RUKA.id, tagToken: "short", deviceToken: "dev-A" })).status).toBe("unverified");
  });

  it("형식은 맞아도 그 카드의 토큰이 아니면 확인 불가", async () => {
    const r = await verifyCard({ cardId: RUKA.id, tagToken: "WRONGTOKEN1", deviceToken: "dev-A" });
    expect(r.status).toBe("unverified");
    const swapped = await verifyCard({ cardId: RUKA.id, tagToken: LUCKY.token, deviceToken: "dev-A" });
    expect(swapped.status).toBe("unverified");
  });

  it("럭키 카드 첫 등록: 연출(reveal)과 혜택 확인(unlocked) 모두 열림", async () => {
    const r = await verifyCard({ cardId: LUCKY.id, tagToken: LUCKY.token, deviceToken: "dev-A" });
    expect(r.status).toBe("verified");
    if (r.status !== "verified") return;
    expect(r.lucky).toMatchObject({ isLuckyCard: true, unlocked: true, reveal: true });
    const again = await verifyCard({ cardId: LUCKY.id, tagToken: LUCKY.token, deviceToken: "dev-A" });
    if (again.status !== "verified") throw new Error("expected verified");
    expect(again.lucky.reveal).toBe(false);
    expect(again.lucky.unlocked).toBe(true);
  });
});
