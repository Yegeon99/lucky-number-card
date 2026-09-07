import "server-only";
import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findLucky, getCards, findDesign } from "@/lib/catalog";

export const MISSING_CARD_PATH = "/c/bm-choom-unknown-9999?t=ZZZZ0000AAAA";

/**
 * 데모 QR 3장을 outputs/ 에 만든다: 정품 일반 예시, 럭키, 확인 불가(목록에 없는 카드).
 * 관리 화면에서 번호를 고칠 때와 npm run qr 에서 같은 규칙을 쓴다.
 */
export async function generateDemoQr(baseUrl: string): Promise<{ label: string; url: string; file: string }[]> {
  const base = baseUrl.replace(/\/$/, "");
  const cards = getCards();
  const lucky = cards.find((c) => findLucky(c));
  const normal = cards.find((c) => !findLucky(c));
  const picks: { label: string; slug: string; url: string }[] = [];
  if (normal) picks.push({ label: `정품 일반 (${findDesign(normal.designId)?.member ?? normal.designId} ${normal.serial})`, slug: normal.id, url: `${base}/c/${normal.id}?t=${normal.tagToken}` });
  if (lucky) picks.push({ label: `럭키 (${findDesign(lucky.designId)?.member ?? lucky.designId} ${lucky.serial})`, slug: lucky.id, url: `${base}/c/${lucky.id}?t=${lucky.tagToken}` });
  picks.push({ label: "확인 불가 (목록에 없는 카드)", slug: "unknown-card", url: `${base}${MISSING_CARD_PATH}` });

  const outDir = path.join(process.cwd(), "outputs");
  mkdirSync(outDir, { recursive: true });
  // 이전 번호로 만든 QR 은 지워서 헷갈리지 않게 한다.
  const { readdirSync, unlinkSync } = await import("node:fs");
  for (const f of readdirSync(outDir)) if (/^qr_.*\.png$/.test(f)) unlinkSync(path.join(outDir, f));

  const results: { label: string; url: string; file: string }[] = [];
  for (const p of picks) {
    const file = path.join(outDir, `qr_${p.slug}.png`);
    await QRCode.toFile(file, p.url, { width: 720, margin: 2, errorCorrectionLevel: "M" });
    results.push({ label: p.label, url: p.url, file });
  }
  writeFileSync(path.join(outDir, "demo-urls.txt"), results.map((r) => `${r.label}\t${r.url}`).join("\n") + "\n", "utf8");
  return results;
}
