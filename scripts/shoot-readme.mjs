// README 용 화면 캡처. 폰 폭(390×844) 헤드리스로 주요 화면을 순서대로 찍어 docs/screenshots/ 에 저장한다.
// smoke.mjs 와 같은 방식으로 별도 포트(3100)에 배포용 빌드를 띄우고 등록 상태는 임시 파일에 쓴다.
// 실제 data/registrations.json 과 Redis 는 건드리지 않는다.
// 사용: node scripts/shoot-readme.mjs            (SKIP_BUILD=1 이면 이미 있는 빌드를 그대로 쓴다)
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const PORT = 3100;
const base = `http://localhost:${PORT}`;
const OUT = path.join("docs", "screenshots");
const ADMIN_PASSWORD = "readme-demo";
const NEXT_BIN = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const CARDS = {
  plain: "/c/bm-choom-pharita-0107?t=P3WZ8HN5LC2D",
  lucky: "/c/bm-choom-chiquita-0217?t=C4NQ7YB3ZH9J",
  group: "/c/bm-choom-group-0504?t=R5XC3BQ9WN7E",
  rest: [
    "/c/bm-choom-asa-0733?t=A9F4JD7VXQ1S",
    "/c/bm-choom-ahyeon-0258?t=H2RT6MZ8KP5Y",
    "/c/bm-choom-rora-0619?t=L8DK2VF6TM4G",
    "/c/bm-choom-ruka-0320?t=K7M2QX9RA4TB",
  ],
  unknown: "/c/bm-choom-unknown-9999?t=ZZZZ0000AAAA",
};

function run(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], { env, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} 실패 (exit ${code})`))));
  });
}

async function startServer() {
  const storeFile = path.join(mkdtempSync(path.join(tmpdir(), "lnc-readme-")), "registrations.json");
  const env = {
    ...process.env,
    LNC_STORE_FILE: storeFile,
    ADMIN_PASSWORD,
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
    KV_REST_API_URL: "",
    KV_REST_API_TOKEN: "",
  };
  if (process.env.SKIP_BUILD !== "1") {
    console.log("배포용 빌드 중 (next build)...");
    await run(["build"], env);
  }
  const server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], { env, stdio: "ignore" });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/`);
      if (res.ok) return server;
    } catch {
      // 아직 안 뜸
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("서버가 60초 안에 뜨지 않았습니다");
}

const server = await startServer();
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const phone = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

// 전체 페이지 캡처일 때 하단 고정 탭 바는 숨긴다(긴 이미지 중간에 겹쳐 찍히므로).
async function shot(page, name, { full = false, wait = 1500 } = {}) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  await page.waitForTimeout(wait);
  if (full) await page.addStyleTag({ content: "nav.fixed{display:none!important}" });
  const file = path.join(OUT, `${name}.jpg`);
  await page.screenshot({ path: file, fullPage: full, type: "jpeg", quality: 82 });
  if (full) await page.evaluate(() => document.querySelectorAll("style:last-of-type").forEach((s) => s.textContent?.includes("nav.fixed") && s.remove()));
  console.log(`저장 ${file}`);
}

try {
  // 폰 A: 첫 등록자
  const a = await browser.newContext(phone);
  const page = await a.newPage();

  // 1. 홈 (관리자 모드 꺼짐: 도감이 비어 있어 전부 흐림)
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await shot(page, "01-home", { full: true });

  // 2. 홈 관리자 모드 켬 (이름판, 힌트 점)
  await page.locator('label[for="admin-mode"]').click();
  await shot(page, "02-home-admin-mode", { full: true });
  await page.locator('label[for="admin-mode"]').click();

  // 3. 카드 홈: 정품 확인, 첫 등록
  await page.goto(base + CARDS.plain, { waitUntil: "networkidle" });
  await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
  await shot(page, "03-card-verified", { wait: 2500 });

  // 4. 정품 띠 펼침 (상세 정보)
  await page.getByLabel("카드 상세 정보 열기").click();
  await shot(page, "04-card-verified-detail", { wait: 1200 });

  // 5. 럭키 카드: 첫 등록 + 럭키 배지
  await page.goto(base + CARDS.lucky, { waitUntil: "networkidle" });
  await page.getByLabel("LUCKY NUMBER").waitFor({ timeout: 8000 });
  await shot(page, "05-card-lucky", { wait: 2000 });

  // 6. 럭키 배지 탭: 혜택 안내
  await page.getByLabel("LUCKY NUMBER").click();
  await page.getByText("이 번호에는 플러스 혜택이 있어요").waitFor({ timeout: 4000 });
  await shot(page, "06-lucky-benefit", { wait: 1200 });

  // 7. 함께 찍기: 시작 화면
  await page.goto(base + "/studio?card=bm-choom-chiquita-0217", { waitUntil: "networkidle" });
  await page.getByText("함께 찍기").first().waitFor({ timeout: 10_000 });
  await shot(page, "07-studio-intro", { wait: 2000 });

  // 8. 함께 찍기: 사진 넣고 합성 미리보기
  await page.locator('input[type="file"]').first().setInputFiles(path.join("public", "choom", "group-4.webp"));
  await page.getByText("완성하기").waitFor({ timeout: 15_000 });
  await shot(page, "08-studio-compose", { wait: 3000 });

  // 9. 함께 찍기: 완성 (저장·공유)
  await page.getByText("완성하기").click();
  await page.getByText("저장", { exact: true }).waitFor({ timeout: 15_000 });
  await shot(page, "09-studio-result", { wait: 3000 });

  // 10. 단체 카드도 한 장 등록
  await page.goto(base + CARDS.group, { waitUntil: "networkidle" });
  await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
  await page.waitForTimeout(2000);

  // 11. 내 도감 (3장 등록, 나머지 흐림)
  await page.goto(base + "/collection", { waitUntil: "networkidle" });
  await page.getByText("세트 완성률").waitFor({ timeout: 8000 });
  await shot(page, "10-collection", { full: true, wait: 2500 });

  // 12. 홈으로 돌아오면 도감에 있는 멤버만 선명
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await shot(page, "11-home-after-collect", { full: true });

  // 13. 확인 불가 카드
  await page.goto(base + CARDS.unknown, { waitUntil: "networkidle" });
  await page.getByText("확인할 수 없는 카드입니다").first().waitFor({ timeout: 15_000 });
  await shot(page, "12-card-unknown", { wait: 2000 });

  // 14. 럭키 넘버 안내
  await page.goto(base + "/notice", { waitUntil: "networkidle" });
  await shot(page, "13-notice", { full: true });

  // 폰 B: 다른 기기가 이미 등록된 카드를 태그
  const b = await browser.newContext(phone);
  const p2 = await b.newPage();
  await p2.goto(base + CARDS.plain, { waitUntil: "networkidle" });
  await p2.getByText("다른 기기에서 등록된 카드입니다").first().waitFor({ timeout: 15_000 });
  await shot(p2, "14-card-other-device", { wait: 2000 });
  await b.close();

  // 15. 관리: 로그인 화면
  await page.goto(base + "/admin", { waitUntil: "networkidle" });
  await shot(page, "15-admin-login", { wait: 1200 });

  // 16. 관리: 카드 목록 (이 스크립트가 띄운 임시 서버의 임시 비밀번호)
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "들어가기" }).click();
  await page.getByText("발행 카드", { exact: false }).waitFor({ timeout: 10_000 });
  await shot(page, "16-admin-list", { full: true, wait: 2000 });

  // 17. 템플릿 검수
  await page.goto(base + "/templates", { waitUntil: "networkidle" });
  await shot(page, "17-templates", { full: true, wait: 2500 });

  // 18. 나머지 4장도 등록해 세트 7장 완성 → 축하 연출 + 세트 완성 이벤트 안내
  for (const route of CARDS.rest) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1500);
  }
  await page.goto(base + "/collection", { waitUntil: "networkidle" });
  await page.getByText("세트를 모두 모았어요").waitFor({ timeout: 8000 });
  await shot(page, "18-collection-complete", { wait: 1200 });

  // 19. 이벤트 안내 시트
  await page.getByRole("button", { name: "이벤트 안내 보기" }).click();
  await page.getByText("7장을 모두 모은 분께 드려요").waitFor({ timeout: 4000 });
  await shot(page, "19-set-event", { wait: 1200 });

  await a.close();
  console.log("완료");
} finally {
  await browser.close();
  server.kill();
}
