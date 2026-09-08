import "server-only";
import { getCards, getCardSet, getLuckyConfig, type SetEvent } from "@/lib/catalog";

/** 클라이언트 화면에 넘겨도 되는 세트 정보 (토큰 없음). */
export type PublicSet = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumKo?: string;
  issuedPerDesign: number;
  issuedAt: string;
  logoImage: string;
  heroImage?: string;
  groupImage?: string;
  /** 세트 완성 이벤트 안내 (럭키 번호 목록은 포함하지 않는다) */
  setEvent: SetEvent;
  designs: { id: string; member: string; nameEn: string; accent: string; image: string; cutImage?: string; cutoutImage?: string }[];
};

export function getPublicSet(): PublicSet {
  const cardSet = getCardSet();
  const cards = getCards();
  return {
    id: cardSet.id,
    name: cardSet.name,
    artist: cardSet.artist,
    album: cardSet.album,
    albumKo: cardSet.albumKo,
    issuedPerDesign: cardSet.issuedPerDesign,
    issuedAt: cardSet.issuedAt,
    logoImage: cardSet.logoImage,
    heroImage: cardSet.heroImage,
    groupImage: cardSet.groupImage,
    setEvent: getLuckyConfig().setEvent,
    designs: cardSet.designs.map((d) => ({
      ...d,
      image: cards.find((c) => c.designId === d.id)?.image ?? "",
    })),
  };
}
