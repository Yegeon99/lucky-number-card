// 금지 단어와 줄표 전수 검색.
// 화면 문구가 들어가는 파일(app, components, lib, data)을 훑는다.
// "수량, 비율" 은 안내 페이지(app/notice)에서만 허용한다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["app", "components", "lib", "data", "public/sample"];
const banned = ["추첨", "뽑기", "당첨", "미당첨", "꽝", "확률", "가품"];
const noticeOnly = ["수량", "비율"];
const dashes = [/—/, /–/, /ㅡ/, /[가-힣A-Za-z]-[가-힣A-Za-z]/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|json|svg|css|md|txt)$/.test(name)) out.push(p);
  }
  return out;
}

let problems = 0;
for (const t of targets) {
  let files = [];
  try {
    files = walk(path.join(root, t));
  } catch {
    continue;
  }
  for (const file of files) {
    const rel = path.relative(root, file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // 코드 주석은 화면 문구가 아니므로 제외
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      for (const w of banned) {
        if (line.includes(w)) {
          console.log(`금지 단어 "${w}"  ${rel}:${i + 1}  ${trimmed.slice(0, 80)}`);
          problems++;
        }
      }
      if (!rel.replace(/\\/g, "/").startsWith("app/notice")) {
        for (const w of noticeOnly) {
          if (line.includes(w)) {
            console.log(`안내 전용 단어 "${w}"  ${rel}:${i + 1}  ${trimmed.slice(0, 80)}`);
            problems++;
          }
        }
      }
      for (const d of dashes) {
        if (d.test(line) && !/^import|from "|href=|className=|\/\/|https?:/.test(trimmed)) {
          // 하이픈 연결은 식별자(kebab-case)와 CSS 클래스가 대부분이므로 한글 사이 하이픈과 줄표만 잡는다
          if (d.source.includes("가-힣A-Za-z") && !/[가-힣]-[가-힣]/.test(line)) continue;
          console.log(`줄표/하이픈  ${rel}:${i + 1}  ${trimmed.slice(0, 80)}`);
          problems++;
        }
      }
    });
  }
}
console.log(problems === 0 ? "문제 없음" : `${problems}건 확인 필요`);
process.exit(problems === 0 ? 0 : 1);
