import { CardHome } from "@/components/CardHome";

export const dynamic = "force-dynamic";

/**
 * 카드 홈. NFC 카드에 기록되는 주소: /c/[카드식별자]?t=[토큰]
 * 검증은 브라우저에서 기기 토큰과 함께 API로 요청한다.
 */
export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const t = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  return <CardHome cardId={id} tagToken={t ?? null} />;
}
