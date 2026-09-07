// 지침서 8단계 점검표를 자동으로 돌리는 스모크 테스트.
// 별도 포트(3100)에 배포용 빌드 서버를 띄우고 등록 상태는 임시 파일에 쓴다.
// 실제 data/registrations.json 은 건드리지 않으므로 시연용 폰의 "첫 등록" 상태가 바뀌지 않는다.
// 사용: node scripts/smoke.mjs   (BASE_URL 을 주면 서버를 띄우지 않고 그 주소를 검사한다)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const PORT = 3100;
const external = process.env.BASE_URL;
const base = external ?? `http://localhost:${PORT}`;

const CARDS = {
  plain: "/c/bm-choom-ruka-0320?t=K7M2QX9RA4TB",
  lucky: "/c/bm-choom-chiquita-0217?t=C4NQ7YB3ZH9J",
  wrongToken: "/c/bm-choom-ruka-0320?t=WRONGTOKEN1",
  noToken: "/c/bm-choom-ruka-0320",
  unknown: "/c/bm-choom-unknown-9999?t=ZZZZ0000AAAA",
};

let server = null;
const NEXT_BIN = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

function run(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], { env, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} 실패 (exit ${code})`))));
  });
}

/**
 * 개발 서버는 같은 폴더에 하나만 뜰 수 있으므로(Next 16) 배포용 빌드를 만들고 next start 로 띄운다.
 * SKIP_BUILD=1 이면 이미 있는 빌드를 그대로 쓴다.
 */
async function startServer() {
  const storeFile = path.join(mkdtempSync(path.join(tmpdir(), "lnc-smoke-")), "registrations.json");
  const env = { ...process.env, LNC_STORE_FILE: storeFile, UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", KV_REST_API_URL: "", KV_REST_API_TOKEN: "" };
  if (process.env.SKIP_BUILD !== "1") {
    console.log("배포용 빌드 중 (next build)...");
    await run(["build"], env);
  }
  server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], { env, stdio: "ignore" });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/`);
      if (res.ok) return;
    } catch {
      // 아직 안 뜸
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("서버가 60초 안에 뜨지 않았습니다");
}

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "통과" : "실패"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
  } catch (e) {
    record(name, false, e instanceof Error ? e.message : String(e));
  }
}

async function main() {
  if (!external) await startServer();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const statusBar = () => page.locator("div.sticky.top-0").first();

  // 1. 정품 일반 카드: 초록 띠, 번호, 도감 자동 등록
  await check("정품 카드: 상단 띠에 '정품 · No. 0320 / 3000'", async () => {
    await page.goto(base + CARDS.plain);
    await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
    const text = (await statusBar().innerText()).replace(/\s+/g, " ");
    if (!/정품.*0320.*3000/.test(text)) throw new Error(`띠 문구: ${text}`);
  });

  await check("정품 카드: 럭키 아님 → 어떤 결과 문구도 없음", async () => {
    const body = await page.locator("body").innerText();
    for (const banned of ["LUCKY NUMBER", "추첨", "뽑기", "당첨", "미당첨", "꽝", "확률", "가품", "일반", "다음 기회"]) {
      if (body.includes(banned)) throw new Error(`금지 문구 발견: ${banned}`);
    }
  });

  await check("카드 홈: 좌측 상단 뒤로가기 존재", async () => {
    await page.locator('a[aria-label="뒤로"]').first().waitFor({ timeout: 5000 });
  });

  await check("정품 카드: 도감에 자동 등록 (토스트)", async () => {
    await page.getByText("내 도감에 담았어요").waitFor({ timeout: 6000 });
  });

  // 2. 럭키 카드: 첫 등록 연출은 기본 화면 뒤에 붙는다
  await check("럭키 카드: 기본 화면 먼저, 배지는 1초 뒤", async () => {
    await page.goto(base + CARDS.lucky);
    await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
    const early = await page.getByLabel("LUCKY NUMBER").count();
    if (early > 0) throw new Error("배지가 기본 화면과 동시에 나타남");
    await page.getByLabel("LUCKY NUMBER").waitFor({ timeout: 4000 });
  });

  await check("럭키 카드: 배지 누르면 혜택 안내 시트", async () => {
    await page.getByLabel("LUCKY NUMBER").click();
    await page.getByText("이 번호에는 플러스 혜택이 있어요").waitFor({ timeout: 4000 });
    await page.getByLabel("닫기").click();
  });

  // 3. 도감 → 뒤로가기 → 정품 유지 (토큰이 붙어 있어야 한다)
  await check("도감 뒤로가기: 카드 홈 주소에 토큰(?t=) 포함", async () => {
    await page.goto(base + "/collection");
    const href = await page.locator('header a[aria-label="뒤로"]').getAttribute("href");
    if (!href || !href.includes("?t=")) throw new Error(`뒤로가기 주소: ${href}`);
    return href;
  });

  await check("도감 뒤로가기 후에도 정품 표시", async () => {
    await page.locator('header a[aria-label="뒤로"]').click();
    await page.getByText("정품", { exact: false }).first().waitFor({ timeout: 15_000 });
    const text = await statusBar().innerText();
    if (text.includes("확인할 수 없는")) throw new Error("뒤로가기 후 확인 불가로 바뀜");
  });

  await check("도감: 세트 완성률 2 / 7", async () => {
    await page.goto(base + "/collection");
    await page.getByText("세트 완성률").waitFor({ timeout: 8000 });
    const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    if (!/2\s*\/\s*7장/.test(text)) throw new Error(`완성률 문구를 찾지 못함: ${text.slice(0, 120)}`);
  });

  // 4. 함께 찍기: 뒤로가기 토큰, 사진 서버 전송 없음
  await check("함께 찍기: 뒤로가기 주소에 토큰 포함", async () => {
    await page.goto(base + "/studio?card=bm-choom-chiquita-0217");
    await page.getByText("함께 찍기").first().waitFor({ timeout: 10_000 });
    const href = await page.locator('header a[aria-label="뒤로"]').getAttribute("href");
    if (!href || !href.includes("?t=")) throw new Error(`뒤로가기 주소: ${href}`);
  });

  await check("함께 찍기: 갤러리 사진 합성 중 서버로 나가는 이미지 요청 없음", async () => {
    const outgoing = [];
    const onReq = (req) => {
      if (req.method() !== "GET") outgoing.push(`${req.method()} ${req.url()}`);
    };
    page.on("request", onReq);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQIW2P8z8Dwn4EIwDiqkL4KAV3+Ah8QO4sRAAAAAElFTkSuQmCC",
      "base64",
    );
    await page.locator('input[type="file"]').first().setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
    await page.getByText("완성하기").waitFor({ timeout: 10_000 });
    await page.getByText("완성하기").click();
    await page.getByText("저장", { exact: true }).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(800);
    page.off("request", onReq);
    if (outgoing.length > 0) throw new Error(`서버로 나간 요청: ${outgoing.join(", ")}`);
  });

  // 5. 확인 불가 3종
  for (const [label, route] of [
    ["없는 카드", CARDS.unknown],
    ["틀린 토큰", CARDS.wrongToken],
    ["토큰 없음", CARDS.noToken],
  ]) {
    await check(`확인 불가 (${label}): 붉은 띠 + 재시도, 문의`, async () => {
      await page.goto(base + route);
      await page.getByText("확인할 수 없는 카드입니다").first().waitFor({ timeout: 15_000 });
      await page.getByRole("button", { name: "재시도" }).waitFor();
      await page.getByRole("link", { name: "문의" }).first().waitFor();
      const body = await page.locator("body").innerText();
      if (body.includes("가품")) throw new Error("'가품' 단어 사용");
    });
  }

  // 6. 다른 기기 등록: 새 브라우저 컨텍스트 = 새 기기 토큰
  await check("다른 기기: 노란 띠 + 함께 찍기 열림", async () => {
    const other = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p2 = await other.newPage();
    await p2.goto(base + CARDS.plain);
    await p2.getByText("다른 기기에서 등록된 카드입니다").first().waitFor({ timeout: 15_000 });
    const disabled = await p2.getByRole("button", { name: /함께 찍기/ }).isDisabled();
    if (disabled) throw new Error("함께 찍기가 잠겨 있음");
    await other.close();
  });

  // 7. 안내, 404, 메타데이터
  await check("럭키 넘버 안내: 해시값 64자", async () => {
    await page.goto(base + "/notice");
    const code = await page.locator("code").first().innerText();
    if (!/^[0-9a-f]{64}$/.test(code.trim())) throw new Error(`해시: ${code}`);
  });

  await check("없는 주소: 404 화면", async () => {
    const res = await page.goto(base + "/this-does-not-exist");
    if (res?.status() !== 404) throw new Error(`status ${res?.status()}`);
    await page.getByText("찾을 수 없는 화면입니다").waitFor();
  });

  for (const [route, type] of [
    ["/icon", "image/png"],
    ["/apple-icon", "image/png"],
    ["/opengraph-image", "image/png"],
    ["/manifest.webmanifest", "application/manifest+json"],
  ]) {
    await check(`메타데이터 ${route}`, async () => {
      const res = await fetch(base + route);
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes(type)) throw new Error(`${res.status} ${ct}`);
    });
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} / ${results.length} 통과`);
  if (failed.length > 0) process.exitCode = 1;
}

try {
  await main();
} finally {
  if (server) server.kill();
}
