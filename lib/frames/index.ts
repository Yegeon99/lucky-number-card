/**
 * 한 장 프레임 정의. [춤 (CHOOM)] 무드.
 * 내 사진 한 장이 배경이 되고, 멤버 누끼가 왼쪽 또는 오른쪽에 서 있는 것처럼 얹힌다.
 * 종류: 카드별 기본 프레임(머그샷 벽), 금색 테두리(럭키), 단체 프레임(세트 완성).
 */

export type FrameKind = "card" | "lucky" | "group";

/** 그리는 방식 */
export type FrameStyle = "wall" | "gold" | "dark";

/** 멤버가 서는 쪽 */
export type Side = "left" | "right";

export type FrameDef = {
  id: string;
  kind: FrameKind;
  style: FrameStyle;
  name: string;
  /** 카드 전용 프레임이면 디자인 식별자 */
  designId?: string;
  /** 워드마크 (예: CHOOM) */
  wordmark: string;
  /** 워드마크 아래 왼쪽 작은 글자 (아티스트) */
  artist: string;
  /** 멤버 영문 표기 */
  nameEn: string;
  /** 하단 띠 문구 */
  barText: string;
  /** 배경을 지운 멤버 누끼 */
  cutoutImage?: string;
  /** 포인트 색 */
  accent: string;
};

/** 출력물: 폰 세로 사진에 맞는 3:4. 긴 변 2000px. */
export const CANVAS = { w: 1500, h: 2000 };

type DesignSeed = { id: string; member: string; nameEn: string; accent: string; cutImage?: string; cutoutImage?: string };

const WORDMARK = "CHOOM";
const BAR = "BABYMONSTER 3RD MINI ALBUM";

/** 카드별 기본 프레임: 머그샷 벽 */
export function cardFrame(design: DesignSeed, artist: string): FrameDef {
  return {
    id: `frame-${design.id}`,
    kind: "card",
    style: "wall",
    name: `${design.member} 프레임`,
    designId: design.id,
    wordmark: WORDMARK,
    artist,
    nameEn: design.nameEn,
    barText: BAR,
    cutoutImage: design.cutoutImage,
    accent: design.accent,
  };
}

/** 럭키 카드 소유자에게 열리는 금색 프레임 */
export function luckyFrame(artist: string, design?: DesignSeed): FrameDef {
  return {
    id: "frame-lucky-gold",
    kind: "lucky",
    style: "gold",
    name: "럭키 넘버 금색 프레임",
    wordmark: WORDMARK,
    artist,
    nameEn: design?.nameEn ?? "LUCKY NUMBER",
    barText: "LUCKY NUMBER CARD",
    cutoutImage: design?.cutoutImage,
    accent: "#B8891E",
  };
}

/** 세트 완성 시 열리는 단체 프레임 */
export function groupFrame(artist: string, group?: DesignSeed): FrameDef {
  return {
    id: "frame-group",
    kind: "group",
    style: "dark",
    name: "단체 프레임",
    wordmark: WORDMARK,
    artist,
    nameEn: "BABYMONSTER",
    barText: BAR,
    cutoutImage: group?.cutoutImage,
    accent: "#C4161C",
  };
}

export type FrameContext = {
  designs: DesignSeed[];
  artist: string;
  /** 지금 열려 있는 카드의 디자인 */
  currentDesignId: string | null;
  luckyUnlocked: boolean;
  groupUnlocked: boolean;
};

/** 이 기기에서 지금 고를 수 있는 프레임 목록 */
export function availableFrames(ctx: FrameContext): FrameDef[] {
  const list: FrameDef[] = [];
  const current = ctx.designs.find((d) => d.id === ctx.currentDesignId);
  const group = ctx.designs.find((d) => d.id === "group");
  if (current) list.push(cardFrame(current, ctx.artist));
  if (ctx.luckyUnlocked) list.push(luckyFrame(ctx.artist, current));
  if (ctx.groupUnlocked) list.push(groupFrame(ctx.artist, group));
  if (list.length === 0 && ctx.designs[0]) list.push(cardFrame(ctx.designs[0], ctx.artist));
  return list;
}

/** 멤버가 설 쪽을 무작위로 고른다 */
export function randomSide(): Side {
  return Math.random() < 0.5 ? "left" : "right";
}
