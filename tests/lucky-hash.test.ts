import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { luckyListHash } from "@/lib/lucky-hash";

describe("luckyListHash (안내 페이지 사전 공개 해시)", () => {
  it("안내 페이지에 적힌 계산 방법으로 다시 계산하면 같다", () => {
    const file = JSON.parse(readFileSync("data/lucky-numbers.json", "utf8")) as { numbers: { designId: string; serial: string; grade: string }[] };
    const lines = file.numbers.map((n) => `${n.designId}:${n.serial}:${n.grade}`).sort();
    const expected = createHash("sha256").update(lines.join("\n"), "utf8").digest("hex");
    expect(luckyListHash()).toBe(expected);
  });
});
