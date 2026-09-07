"use client";

import { CANVAS, type FrameDef, type Side } from "@/lib/frames";

/** 합성 캔버스 안에서 내 사진이 들어가는 영역. 촬영 화면의 가이드와 크롭이 이 비율을 따른다. */
export function photoArea() {
  const { h } = CANVAS;
  const topH = Math.round(h * 0.13);
  const barH = Math.round(h * 0.048);
  const plateH = Math.round(h * 0.085);
  const photoY = topH;
  const photoH = h - topH - barH - plateH;
  return { topH, barH, plateH, photoY, photoH };
}

/** 내 사진 영역의 가로/세로 비율 (약 1.02, 거의 정사각형) */
export const PHOTO_ASPECT = CANVAS.w / photoArea().photoH;

/**
 * 한 장 합성. 전부 브라우저 캔버스에서 처리하며 어떤 요청에도 이미지를 담지 않는다.
 * 내 사진이 배경, 멤버 누끼가 한쪽에 서고, 위아래로 [CHOOM] 무드의 띠가 붙는다.
 * 결과 1500×2000 (3:4).
 */

export type Shot = HTMLCanvasElement | ImageBitmap | HTMLImageElement;

export type ComposeMeta = {
  serial: string;
  member: string;
  dateText: string;
};

const WIDE = '"Archivo", "Pretendard Variable", Pretendard, "Arial Black", sans-serif';
const SANS = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const WALL = "#DCE7EE";
const WALL_LINE = "rgba(59,67,76,0.6)";
const BLACK = "#111111";
const PLACARD = "#8F8C87";

function sizeOf(shot: Shot): { w: number; h: number } {
  if (shot instanceof HTMLCanvasElement) return { w: shot.width, h: shot.height };
  if (typeof ImageBitmap !== "undefined" && shot instanceof ImageBitmap) return { w: shot.width, h: shot.height };
  const img = shot as HTMLImageElement;
  return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
}

function drawCover(ctx: CanvasRenderingContext2D, shot: Shot, x: number, y: number, w: number, h: number) {
  const { w: sw, h: sh } = sizeOf(shot);
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(shot, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function goldGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#f7e6b0");
  g.addColorStop(0.3, "#e3bd5c");
  g.addColorStop(0.55, "#a87f25");
  g.addColorStop(0.8, "#e8c86c");
  g.addColorStop(1, "#fbedc2");
  return g;
}

type Ctx = CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };

/** 넓은 굵은 영문 (워드마크). 캔버스가 폭 축을 지원하면 넓게, 아니면 자간으로 대신한다. */
function setWide(ctx: CanvasRenderingContext2D, px: number, weight = 900) {
  ctx.font = `${weight} ${px}px ${WIDE}`;
  const c = ctx as Ctx;
  if ("fontStretch" in c) c.fontStretch = "expanded";
  if ("letterSpacing" in c) c.letterSpacing = "fontStretch" in c ? "0.01em" : "0.12em";
}

function setNarrow(ctx: CanvasRenderingContext2D, px: number, weight = 600) {
  ctx.font = `${weight} ${px}px ${WIDE}`;
  const c = ctx as Ctx;
  if ("fontStretch" in c) c.fontStretch = "condensed";
  if ("letterSpacing" in c) c.letterSpacing = "0.04em";
}

function resetFont(ctx: CanvasRenderingContext2D) {
  const c = ctx as Ctx;
  if ("fontStretch" in c) c.fontStretch = "normal";
  if ("letterSpacing" in c) c.letterSpacing = "0px";
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }),
    );
  }
  return imageCache.get(src)!;
}

async function ensureFonts() {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return;
  try {
    await Promise.all([fonts.load(`900 40px ${WIDE}`), fonts.load(`600 40px ${WIDE}`), fonts.load(`700 40px ${SANS}`), fonts.ready]);
  } catch {
    // 서체를 못 받아도 대체 서체로 그린다
  }
}

/** 머그샷 벽 무늬 (옅은 하늘색 + 가로선) */
function paintWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dark: boolean) {
  ctx.fillStyle = dark ? "#111111" : WALL;
  ctx.fillRect(x, y, w, h);
  const gap = Math.round(CANVAS.h * 0.03);
  ctx.fillStyle = dark ? "rgba(196,22,28,0.25)" : WALL_LINE;
  for (let ly = y + gap; ly < y + h; ly += gap) ctx.fillRect(x, ly, w, 3);
}

/**
 * 한 장 합성.
 * photo 가 없으면(템플릿 미리보기) 내 사진 자리를 벽 무늬로 채운다.
 */
export async function composeSingle(photo: Shot | null, frame: FrameDef, side: Side, meta: ComposeMeta): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const cutout = frame.cutoutImage ? await loadImage(frame.cutoutImage) : null;

  const { w, h } = CANVAS;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const dark = frame.style === "dark";
  const gold = frame.style === "gold";
  const fg = dark ? "#F4F1EA" : BLACK;
  const border = gold ? Math.round(w * 0.028) : 0;
  const padX = Math.round(w * 0.06);

  const { topH, barH, plateH, photoY, photoH } = photoArea();
  const bottomZone = barH + plateH;

  // 1. 내 사진 (배경). 없으면 자리 표시.
  if (photo) {
    drawCover(ctx, photo, 0, photoY, w, photoH);
  } else {
    paintWall(ctx, 0, photoY, w, photoH, dark);
    ctx.fillStyle = dark ? "rgba(244,241,234,0.35)" : "rgba(17,17,17,0.35)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(w * 0.045)}px ${SANS}`;
    const cx = side === "left" ? w * 0.68 : w * 0.32;
    ctx.fillText("내 사진 자리", cx, photoY + photoH * 0.42);
    ctx.font = `500 ${Math.round(w * 0.026)}px ${SANS}`;
    ctx.fillText("셀카를 찍거나 갤러리에서 한 장", cx, photoY + photoH * 0.42 + w * 0.06);
  }

  // 2. 멤버 쪽으로 옅은 그림자를 깔아 사진과 어울리게 한다
  const shade = ctx.createLinearGradient(side === "left" ? 0 : w, 0, side === "left" ? w * 0.55 : w * 0.45, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.28)");
  shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, photoY, w, photoH);
  // 아래쪽도 살짝 어둡게
  const bottomShade = ctx.createLinearGradient(0, photoY + photoH * 0.6, 0, photoY + photoH);
  bottomShade.addColorStop(0, "rgba(0,0,0,0)");
  bottomShade.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0, photoY, w, photoH);

  // 3. 멤버 누끼: 사진 영역 바닥에 발을 붙이고 한쪽에 선다
  if (cutout) {
    const targetH = photoH * (frame.kind === "group" ? 0.62 : 0.86);
    const scale = targetH / cutout.naturalHeight;
    const cw = cutout.naturalWidth * scale;
    const ch = cutout.naturalHeight * scale;
    const maxW = frame.kind === "group" ? w * 0.92 : w * 0.6;
    const s2 = Math.min(1, maxW / cw);
    const dw = cw * s2;
    const dh = ch * s2;
    const dx = frame.kind === "group" ? (w - dw) / 2 : side === "left" ? -dw * 0.06 : w - dw * 0.94;
    const dy = photoY + photoH - dh + dh * 0.01;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = Math.round(w * 0.03);
    ctx.shadowOffsetX = side === "left" ? Math.round(w * 0.012) : -Math.round(w * 0.012);
    ctx.shadowOffsetY = Math.round(w * 0.01);
    ctx.beginPath();
    ctx.rect(0, photoY, w, photoH);
    ctx.clip();
    ctx.drawImage(cutout, dx, dy, dw, dh);
    ctx.restore();
  }

  // 4. 상단 띠: 머그샷 벽 + 워드마크 + 아티스트 / 멤버 영문
  paintWall(ctx, 0, 0, w, topH, dark);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = dark ? frame.accent : fg;
  const wmSize = Math.round(w * 0.135);
  setWide(ctx, wmSize);
  ctx.fillText(frame.wordmark, w / 2, topH * 0.66);
  setWide(ctx, Math.round(wmSize * 0.2), 800);
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.fillText(frame.artist.toUpperCase(), padX, topH * 0.9);
  ctx.textAlign = "right";
  ctx.fillText(frame.nameEn.toUpperCase(), w - padX, topH * 0.9);
  resetFont(ctx);
  // 띠와 사진 사이 가는 검정 선
  ctx.fillStyle = dark ? "rgba(196,22,28,0.6)" : "rgba(17,17,17,0.8)";
  ctx.fillRect(0, topH - 4, w, 4);

  // 5. 하단: 이름판 영역(벽) + 레드 띠
  const plateY = h - bottomZone;
  paintWall(ctx, 0, plateY, w, plateH, dark);
  // 이름판 (머그샷 플레이트): 멤버 반대쪽에 둔다
  const pw = Math.round(w * 0.5);
  const ph = Math.round(plateH * 0.74);
  const px = side === "left" ? w - padX - pw : padX;
  const py = plateY + (plateH - ph) / 2;
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate(side === "left" ? -0.02 : 0.02);
  ctx.translate(-(px + pw / 2), -(py + ph / 2));
  ctx.fillStyle = dark ? "#2a2826" : PLACARD;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, px, py, pw, ph, 5);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  setNarrow(ctx, Math.round(ph * 0.14), 500);
  ctx.fillText("DEPARTMENT OF CHOOM", px + pw * 0.06, py + ph * 0.27);
  ctx.fillStyle = "#F4F1EA";
  setNarrow(ctx, Math.round(ph * 0.36), 700);
  ctx.fillText(frame.nameEn.toUpperCase(), px + pw * 0.06, py + ph * 0.64);
  setNarrow(ctx, Math.round(ph * 0.21), 600);
  ctx.fillText(`NO. ${meta.serial}`, px + pw * 0.06, py + ph * 0.9);
  resetFont(ctx);
  ctx.textAlign = "right";
  ctx.font = `500 ${Math.round(ph * 0.17)}px ${SANS}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(meta.member, px + pw * 0.94, py + ph * 0.9);
  ctx.restore();

  // 레드 띠 (럭키는 금색)
  const barY = h - barH;
  ctx.fillStyle = gold ? goldGradient(ctx, w, h) : frame.accent;
  ctx.fillRect(0, barY, w, barH);
  ctx.fillStyle = gold ? "#3a2a08" : "#FFFFFF";
  setWide(ctx, Math.round(barH * 0.36), 800);
  const dateLabel = meta.dateText.replace(/\./g, ". ").trim();
  ctx.textAlign = "left";
  ctx.fillText(frame.barText, padX, barY + barH * 0.66);
  ctx.textAlign = "right";
  ctx.fillText(dateLabel, w - padX, barY + barH * 0.66);
  resetFont(ctx);

  // 6. 금색 테두리 (럭키)
  if (gold) {
    ctx.save();
    ctx.strokeStyle = goldGradient(ctx, w, h);
    ctx.lineWidth = border * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(border + 1.5, border + 1.5, w - border * 2 - 3, h - border * 2 - 3);
    ctx.restore();
  }

  // 7. 모서리 살짝 둥글게 (출력물 느낌)
  const rounded = document.createElement("canvas");
  rounded.width = w;
  rounded.height = h;
  const rctx = rounded.getContext("2d")!;
  roundRect(rctx, 0, 0, w, h, Math.round(w * 0.02));
  rctx.clip();
  rctx.drawImage(canvas, 0, 0);
  return rounded;
}

/** 배경화면 비율(9:19.5)로 자르기. 부족한 곳은 바탕색으로 채운다. */
export function toWallpaper(src: HTMLCanvasElement, paper: string): HTMLCanvasElement {
  const targetH = 2000;
  const targetW = Math.round((targetH * 9) / 19.5);
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, targetW, targetH);
  const scale = Math.min((targetW * 0.88) / src.width, (targetH * 0.88) / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(src, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
  return out;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob 실패"))), type, quality);
  });
}

export function todayText(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
