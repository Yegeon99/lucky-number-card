import { DemoLanding } from "@/components/DemoLanding";
import { findDesign, findLucky, getCards, getCardSet } from "@/lib/catalog";
import { MISSING_CARD_PATH } from "@/lib/qr";

export const dynamic = "force-dynamic";

/**
 * 데모 시연용 입구. 실제 팬은 NFC 태그로 /c/[id]?t=... 주소에 바로 들어온다.
 * 럭키 여부와 의미 번호는 관리자 모드 힌트 점을 위해서만 내려가며 문구로는 쓰지 않는다.
 */
export default function DemoIndex() {
  const cardSet = getCardSet();
  const items = getCards().map((c) => {
    const design = findDesign(c.designId);
    return {
      id: c.id,
      member: design?.member ?? c.designId,
      nameEn: design?.nameEn ?? c.designId.toUpperCase(),
      serial: c.serial,
      image: c.image,
      href: `/c/${c.id}?t=${c.tagToken}`,
      accent: design?.accent ?? "#999999",
      hint: findLucky(c) ? ("lucky" as const) : c.meaning ? ("meaning" as const) : null,
    };
  });

  return (
    <DemoLanding
      items={items}
      missingHref={MISSING_CARD_PATH}
      hero={{
        image: cardSet.heroImage ?? "",
        artist: cardSet.artist,
        album: cardSet.album,
      }}
      footer={`${cardSet.artist} · ${cardSet.album} · 제작 ${cardSet.manufacturer}`}
    />
  );
}
