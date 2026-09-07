// 샘플 이미지 자리(SVG)를 만든다. 공식 이미지가 들어오면 같은 파일명으로 교체한다.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "public", "sample");
mkdirSync(dir, { recursive: true });

const designs = [
  { id: "ruka", member: "루카", accent: "#5B4FCF" },
  { id: "pharita", member: "파리타", accent: "#C24E6B" },
  { id: "asa", member: "아사", accent: "#2F8F83" },
  { id: "ahyeon", member: "아현", accent: "#C8842A" },
  { id: "rami", member: "라미", accent: "#3E7CC9" },
  { id: "rora", member: "로라", accent: "#B0508A" },
  { id: "chiquita", member: "치키타", accent: "#5E8F3B" },
];

function mix(hex, t, to = "#ffffff") {
  const a = hex.match(/\w\w/g).map((v) => parseInt(v, 16));
  const b = to.match(/\w\w/g).map((v) => parseInt(v, 16));
  return (
    "#" +
    a
      .map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0"))
      .join("")
  );
}

for (const d of designs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1700" viewBox="0 0 1100 1700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${mix(d.accent, 0.15)}"/>
      <stop offset="0.55" stop-color="${d.accent}"/>
      <stop offset="1" stop-color="${mix(d.accent, 0.45, "#000000")}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.3" cy="0.25" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1100" height="1700" fill="url(#g)"/>
  <rect width="1100" height="1700" fill="url(#h)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3">
    <rect x="60" y="60" width="980" height="1580" rx="28"/>
  </g>
  <text x="550" y="780" text-anchor="middle" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="150" font-weight="700" fill="#ffffff" fill-opacity="0.92">${d.member}</text>
  <text x="550" y="880" text-anchor="middle" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="46" font-weight="500" letter-spacing="6" fill="#ffffff" fill-opacity="0.75">BABYMONSTER · DRIP</text>
  <text x="550" y="1560" text-anchor="middle" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="38" font-weight="500" fill="#ffffff" fill-opacity="0.8">샘플 이미지, 실제 상품과 무관</text>
</svg>`;
  writeFileSync(path.join(dir, `card-${d.id}.svg`), svg, "utf8");
}

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" viewBox="0 0 600 160">
  <text x="300" y="100" text-anchor="middle" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="84" font-weight="800" letter-spacing="14" fill="#161616">DRIP</text>
  <text x="300" y="140" text-anchor="middle" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="20" font-weight="500" fill="#8a8a8a">앨범 로고 자리, 샘플 이미지, 실제 상품과 무관</text>
</svg>`;
writeFileSync(path.join(dir, "logo-drip.svg"), logo, "utf8");

const readme = `이 폴더의 파일은 모두 자리 표시용 샘플입니다 (샘플 이미지, 실제 상품과 무관).

공식 이미지로 바꾸는 방법
- 카드 컷: card-<디자인식별자>.svg 를 같은 이름의 파일로 교체합니다. (png, jpg 로 바꾸려면 data/cards.json 의 image 경로도 함께 바꿉니다.)
  디자인 식별자: ruka, pharita, asa, ahyeon, rami, rora, chiquita
- 앨범 로고: logo-drip.svg 를 교체합니다. (data/cards.json 의 set.logoImage)
- 권장 크기: 카드 컷 1100×1700 이상 (55×85 크기), 로고 가로 600 이상 투명 배경
`;
writeFileSync(path.join(dir, "README.txt"), readme, "utf8");
console.log("샘플 이미지 생성 완료:", dir);
