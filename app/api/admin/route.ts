import { NextResponse } from "next/server";
import { findDesign, findLucky, getCards, getCardSet, updateCardSerial } from "@/lib/catalog";
import { luckyListHash } from "@/lib/lucky-hash";
import { generateDemoQr } from "@/lib/qr";
import { deleteRegistration, listRegistrations, resetAll } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = request.headers.get("x-admin-key") ?? "";
  return given === expected;
}

function baseUrlOf(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

async function buildRows() {
  const cards = getCards();
  const cardSet = getCardSet();
  const registrations = await listRegistrations();
  const byCard = new Map(registrations.map((r) => [r.cardId, r]));
  return cards.map((card) => {
    const reg = byCard.get(card.id);
    const lucky = findLucky(card);
    const status: "unregistered" | "registered" | "lucky" = !reg ? "unregistered" : lucky ? "lucky" : "registered";
    return {
      id: card.id,
      designId: card.designId,
      member: findDesign(card.designId)?.member ?? card.designId,
      serial: card.serial,
      serialNote: card.serialNote ?? null,
      meaning: card.meaning ?? null,
      issued: cardSet.issuedPerDesign,
      status,
      isLuckyCard: Boolean(lucky),
      viewCount: reg?.viewCount ?? 0,
      registeredAt: reg?.registeredAt ?? null,
      lastViewedAt: reg?.lastViewedAt ?? null,
      tagToken: card.tagToken,
    };
  });
}

/** GET /api/admin : 카드 목록과 등록 상태 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await buildRows();
  return NextResponse.json({ rows, luckyHash: luckyListHash() }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/admin : 데모 초기화 (등록 상태 전체 해제) */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await resetAll();
  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/admin : 카드 번호 수정 { designId, serial }
 * 카드 식별자와 주소가 바뀌고, 럭키 목록의 같은 번호도 함께 옮겨지며, 데모 QR 을 다시 만든다.
 */
export async function PATCH(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { designId?: unknown; serial?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const designId = typeof body.designId === "string" ? body.designId : "";
  const serial = typeof body.serial === "string" ? body.serial.trim() : "";
  try {
    const { before, after } = updateCardSerial(designId, serial);
    if (before.id !== after.id) await deleteRegistration(before.id);
    const qr = await generateDemoQr(baseUrlOf(request));
    const rows = await buildRows();
    return NextResponse.json({ ok: true, card: after, qr, rows, luckyHash: luckyListHash() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "수정 실패" }, { status: 400 });
  }
}
