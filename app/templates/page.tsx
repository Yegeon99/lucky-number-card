import { Templates } from "@/components/Templates";
import { getCards } from "@/lib/catalog";
import { getPublicSet } from "@/lib/public-set";

export const dynamic = "force-dynamic";

/** 멤버별 샘플 템플릿 검수 화면 */
export default function TemplatesPage() {
  const serials = Object.fromEntries(getCards().map((c) => [c.designId, c.serial]));
  return <Templates set={getPublicSet()} serials={serials} />;
}
