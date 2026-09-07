// 폰 폭(390×844) 헤드리스 캡처. 사용: node scripts/shoot.mjs <출력폴더> <이름=경로> [<이름=경로> ...]
// 예: node scripts/shoot.mjs out landing=/ card=/c/bm-choom-ruka-0320?t=K7M2QX9RA4TB
// 이름 뒤에 :full 을 붙이면 전체 페이지, :wait=밀리초 로 대기 시간 조정, :click=CSS선택자 로 클릭 후 캡처.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [outDir = "outputs/shots", ...specs] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();

for (const spec of specs) {
  const [namePart, ...opts] = spec.split(":");
  const eq = namePart.indexOf("=");
  const name = namePart.slice(0, eq);
  const route = namePart.slice(eq + 1);
  const full = opts.includes("full");
  const waitOpt = opts.find((o) => o.startsWith("wait="));
  const clickOpt = opts.find((o) => o.startsWith("click="));
  const wait = waitOpt ? Number(waitOpt.slice(5)) : 2500;
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  if (clickOpt) {
    await page.click(clickOpt.slice(6));
  }
  await page.waitForTimeout(wait);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: full });
  console.log(`저장 ${file}`);
}

await browser.close();
