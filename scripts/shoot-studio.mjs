// 함께 찍기(한 장 합성) 결과 캡처 (헤드리스). 사용: node scripts/shoot-studio.mjs <출력폴더> <카드식별자> <토큰>
// 내 사진 자리는 public/choom 의 단체 북릿 컷 한 장을 갤러리 선택처럼 넣는다.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [outDir = "outputs/shots", cardId, token] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync(outDir, { recursive: true });
const photo = path.join("public", "choom", "group-4.webp");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
// 카드 홈을 먼저 열어 세션 카드와 도감을 만든다
await page.goto(`${base}/c/${cardId}?t=${token}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.goto(`${base}/studio?card=${cardId}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(outDir, "studio_intro.png") });
await page.setInputFiles('input[type="file"]', photo);
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(outDir, "studio_compose.png") });
const frames = await page.$$eval("button", (bs) => bs.map((b) => b.textContent.trim()).filter((t) => /프레임/.test(t)));
console.log("프레임:", frames);
// 반대쪽으로 바꿔 한 장
await page.click('button:has-text("오른쪽")');
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(outDir, "studio_compose_right.png") });
const unlock = await page.$$('button:has-text("해금")');
if (unlock[0]) {
  await unlock[0].click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, "studio_compose_lucky.png") });
}
await page.click('button:has-text("완성하기")');
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(outDir, "studio_result.png") });
await browser.close();
console.log("완료");
