// 멤버 화보에서 배경을 지워 누끼 PNG 를 만든다. public/choom/cutout/<디자인>.png
// 원본: 개인은 <id>-3.webp (스튜디오 전신 컷), 단체는 group-3.webp
// 사용: node scripts/make-cutouts.mjs [id ...]
import { removeBackground } from "@imgly/background-removal-node";
import path from "node:path";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)(path.join(process.cwd(), "node_modules", "@imgly", "background-removal-node", "node_modules", "sharp"));
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const root = process.cwd();
const src = path.join(root, "public", "choom");
const out = path.join(src, "cutout");
mkdirSync(out, { recursive: true });

const data = JSON.parse(readFileSync(path.join(root, "data", "cards.json"), "utf8"));
const wanted = process.argv.slice(2);
const targets = data.set.designs
  .map((d) => ({ id: d.id, file: d.id === "group" ? "group-3.webp" : `${d.id}-3.webp` }))
  .filter((t) => wanted.length === 0 || wanted.includes(t.id));

for (const t of targets) {
  const input = path.join(src, t.file);
  if (!existsSync(input)) {
    console.log(`없음 ${t.file}`);
    continue;
  }
  // 모델 입력은 png 로 넘긴다 (webp 디코딩 호환)
  const png = await sharp(input).png().toBuffer();
  const blob = new Blob([png], { type: "image/png" });
  const result = await removeBackground(blob, { model: "medium", output: { format: "image/png", quality: 1 } });
  const buf = Buffer.from(await result.arrayBuffer());
  // 투명 여백을 잘라내고 긴 변 1600 으로 맞춘다
  const trimmed = await sharp(buf).trim({ threshold: 8 }).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  const file = path.join(out, `${t.id}.png`);
  writeFileSync(file, trimmed);
  const meta = await sharp(trimmed).metadata();
  console.log(`저장 ${t.id}.png ${meta.width}x${meta.height} ${(trimmed.length / 1024).toFixed(0)}KB`);
}
console.log("완료");
