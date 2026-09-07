// 데모 QR 3장(정품 일반, 럭키, 확인 불가)을 outputs/ 에 만든다.
// 사용: node scripts/make-qr.mjs [기본주소]
// 기본주소를 생략하면 같은 와이파이의 폰에서 열 수 있도록 이 컴퓨터의 네트워크 주소를 쓴다.
// 관리 화면에서 번호를 고치면 서버가 같은 규칙(lib/qr.ts)으로 자동 재생성한다.
import QRCode from "qrcode";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";

const root = process.cwd();
const data = JSON.parse(readFileSync(path.join(root, "data", "cards.json"), "utf8"));
const lucky = JSON.parse(readFileSync(path.join(root, "data", "lucky-numbers.json"), "utf8"));

function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list ?? []) {
      if (n.family === "IPv4" && !n.internal) return n.address;
    }
  }
  return "localhost";
}

const base = (process.argv[2] ?? `http://${lanIp()}:3000`).replace(/\/$/, "");
const isLucky = (c) => lucky.numbers.some((n) => n.designId === c.designId && n.serial === c.serial);
const member = (c) => data.set.designs.find((d) => d.id === c.designId)?.member ?? c.designId;

const normal = data.cards.find((c) => !isLucky(c));
const luckyCard = data.cards.find((c) => isLucky(c));
const picks = [
  { label: `정품 일반 (${member(normal)} ${normal.serial})`, slug: normal.id, url: `${base}/c/${normal.id}?t=${normal.tagToken}` },
  { label: `럭키 (${member(luckyCard)} ${luckyCard.serial})`, slug: luckyCard.id, url: `${base}/c/${luckyCard.id}?t=${luckyCard.tagToken}` },
  { label: "확인 불가 (목록에 없는 카드)", slug: "unknown-card", url: `${base}/c/bm-choom-unknown-9999?t=ZZZZ0000AAAA` },
];

const outDir = path.join(root, "outputs");
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) if (/^qr_.*\.png$/.test(f)) unlinkSync(path.join(outDir, f));

const lines = [];
for (const p of picks) {
  const file = path.join(outDir, `qr_${p.slug}.png`);
  await QRCode.toFile(file, p.url, { width: 720, margin: 2, errorCorrectionLevel: "M" });
  lines.push(`${p.label}\t${p.url}`);
  console.log(`${p.label}: ${p.url}\n  -> ${file}`);
}
writeFileSync(path.join(outDir, "demo-urls.txt"), lines.join("\n") + "\n", "utf8");
