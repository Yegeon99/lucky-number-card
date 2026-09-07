// BABYMONSTER 3rd Mini Album [CHOOM] (2026.05.04, YG) 공식 화보를 public/choom/ 에 내려받는다.
// 출처: Kpop Wiki(kpop.fandom.com)에 정리된 YG 공식 공개 이미지. 데모 시연용이며 실제 상품 사용은 기획사 승인 필요.
// 사용: node scripts/fetch-choom.mjs
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "choom");
mkdirSync(OUT, { recursive: true });

// MediaWiki 파일 경로 규칙: /images/<md5[0]>/<md5[0..2]>/<파일명>
function wikiaUrl(filename, width) {
  const h = createHash("md5").update(filename).digest("hex");
  const enc = encodeURIComponent(filename).replace(/'/g, "%27");
  return `https://static.wikia.nocookie.net/kpop/images/${h[0]}/${h.slice(0, 2)}/${enc}/revision/latest/scale-to-width-down/${width}`;
}

const MEMBERS = ["Ruka", "Pharita", "Asa", "Ahyeon", "Rora", "Chiquita"];

const files = [
  // 앨범 커버와 티저
  ["BABYMONSTER_Choom_digital_album_cover.png", "cover-digital.webp", 1400],
  ["BABYMONSTER_Choom_physical_album_cover_(Crimson_Ver.).png", "cover-crimson.webp", 1400],
  ["BABYMONSTER_Choom_physical_album_cover_(Metalic_Ver.).png", "cover-metallic.webp", 1400],
  ["BABYMONSTER_Choom_physical_album_cover_(Prism_Ver.).png", "cover-prism.webp", 1400],
  ["BABYMONSTER_Choom_teaser.png", "teaser.webp", 1400],
  ["BABYMONSTER_Choom_D-Day_poster.png", "poster-dday.webp", 1400],
  // 단체
  ["BABYMONSTER_Choom_group_teaser_photo_(1).png", "group-1.webp", 1600],
  ["BABYMONSTER_Choom_Digital_Booklet_exclusive_group_concept_photo_(1).png", "group-2.webp", 1600],
  ["BABYMONSTER_Choom_Digital_Booklet_exclusive_group_concept_photo_(2).png", "group-3.webp", 1600],
  ["BABYMONSTER_Choom_Digital_Booklet_exclusive_group_concept_photo_(3).png", "group-4.webp", 1600],
  ["BABYMONSTER_Choom_Digital_Booklet_exclusive_group_concept_photo_(4).png", "group-5.webp", 1600],
];
for (const m of MEMBERS) {
  const id = m.toLowerCase();
  files.push([`BABYMONSTER_${m}_Choom_teaser_photo_(1).png`, `${id}-1.webp`, 1400]);
  files.push([`BABYMONSTER_${m}_Choom_Digital_Booklet_exclusive_concept_photo_(1).png`, `${id}-2.webp`, 1400]);
  files.push([`BABYMONSTER_${m}_Choom_Digital_Booklet_exclusive_concept_photo_(2).png`, `${id}-3.webp`, 1400]);
}

const manifest = [];
for (const [src, name, width] of files) {
  const url = wikiaUrl(src, width);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.log(`실패 ${res.status}  ${src}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path.join(OUT, name), buf);
  manifest.push({ file: name, source: src, bytes: buf.length });
  console.log(`저장 ${name}  ${(buf.length / 1024).toFixed(0)}KB`);
}
writeFileSync(
  path.join(OUT, "SOURCES.txt"),
  [
    "BABYMONSTER 3rd Mini Album [CHOOM] 공식 공개 이미지 (YG Entertainment, 2026.05.04)",
    "정리 출처: https://kpop.fandom.com/wiki/Choom_(BABYMONSTER) 및 멤버별 Gallery",
    "데모 시연용. 실제 상품과 서비스에 쓰려면 기획사(YG) 승인 필요.",
    "라미는 활동 중단으로 이 앨범 화보가 없음.",
    "",
    ...manifest.map((m) => `${m.file}\t${m.source}`),
  ].join("\n") + "\n",
  "utf8",
);
console.log(`완료: ${manifest.length}개`);
