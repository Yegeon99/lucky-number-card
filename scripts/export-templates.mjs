// /templates 화면에서 멤버별 샘플 템플릿 PNG 를 뽑아 outputs/templates/ 에 저장한다.
// 사용: node scripts/export-templates.mjs   (개발 서버가 떠 있어야 함)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "outputs", "templates");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${base}/templates`, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelectorAll("img[data-template]").length >= 8, null, { timeout: 60000 });
await page.waitForTimeout(500);

const list = await page.$$eval("img[data-template]", (imgs) => imgs.map((i) => i.getAttribute("data-template")));
for (const key of list) {
  const dataUrl = await page.evaluate(async (k) => {
    const img = document.querySelector(`img[data-template="${k}"]`);
    const res = await fetch(img.src);
    const blob = await res.blob();
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(blob);
    });
  }, key);
  const buf = Buffer.from(String(dataUrl).split(",")[1], "base64");
  writeFileSync(path.join(outDir, `template_${key}.png`), buf);
  console.log(`저장 outputs/templates/template_${key}.png`);
}
await page.screenshot({ path: path.join(outDir, "templates_page.png"), fullPage: true });
await browser.close();
