import { NextResponse } from "next/server";
import { verifyCard } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cards/[id]
 * body: { tagToken: string | null, deviceToken: string }
 * 카드 확인과 등록 처리를 한 번에 한다. 사진이나 개인정보는 받지 않는다.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: { tagToken?: unknown; deviceToken?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken.slice(0, 64) : "";
  const tagToken = typeof body.tagToken === "string" ? body.tagToken.slice(0, 128) : null;

  if (!deviceToken) {
    return NextResponse.json({ error: "deviceToken required" }, { status: 400 });
  }

  const result = await verifyCard({ cardId: id, tagToken, deviceToken });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
