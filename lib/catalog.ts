import "server-only";
import { readFileSync, statSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";

/**
 * 카드 목록과 럭키 목록. data/*.json 을 요청 시점에 읽는다.
 * 관리 화면에서 번호를 고치면 파일이 바뀌고 다음 요청부터 바로 반영된다.
 */

/** 카드 디자인(멤버별 1종). 같은 디자인이 issuedPerDesign 장 발행된다. */
export type CardDesign = {
  id: string;
  member: string;
  /** 영문 표기. 프레임과 카드 플레이트에 쓴다. */
  nameEn: string;
  accent: string;
  /** 프레임에 들어가는 아티스트 컷 (배경 있음) */
  cutImage?: string;
  /** 배경을 지운 누끼 PNG. 한 장 프레임에서 멤버가 옆에 서 있는 것처럼 보이게 한다 */
  cutoutImage?: string;
};

export type CardSet = {
  id: string;
  name: string;
  artist: string;
  album: string;
  issuedPerDesign: number;
  issuedAt: string;
  manufacturer: string;
  logoImage: string;
  /** 앨범 한글 제목 (예: 춤) */
  albumKo?: string;
  /** 첫 화면 배경 (앨범 커버) */
  heroImage?: string;
  /** 도감 상단 단체 이미지 */
  groupImage?: string;
  designs: CardDesign[];
};

/** 실물 카드 1장. 서버만 아는 값(tagToken)을 포함하므로 그대로 내려 보내지 않는다. */
export type CardRecord = {
  id: string;
  designId: string;
  serial: string;
  /** 예: "확인 필요". 관리 화면에 표시된다. */
  serialNote?: string;
  tagToken: string;
  image: string;
  frameId: string;
  meaning?: string;
};

export type LuckyGrade = { grade: string; count: number; benefit: string };
export type LuckyNumber = { designId: string; serial: string; grade: string };

export type LuckyConfig = {
  publishedAt: string;
  revealAt: string;
  entryDeadline: string;
  contact: string;
  grades: LuckyGrade[];
  numbers: LuckyNumber[];
};

type CardsFile = { _comment?: string; set: CardSet; cards: CardRecord[] };
type LuckyFile = { _comment?: string } & LuckyConfig;

const CARDS_PATH = path.join(process.cwd(), "data", "cards.json");
const LUCKY_PATH = path.join(process.cwd(), "data", "lucky-numbers.json");

function readJson<T>(file: string, cache: { mtime: number; value: T | null }): T {
  const mtime = statSync(file).mtimeMs;
  if (cache.value && cache.mtime === mtime) return cache.value;
  const value = JSON.parse(readFileSync(file, "utf8")) as T;
  cache.mtime = mtime;
  cache.value = value;
  return value;
}

const cardsCache: { mtime: number; value: CardsFile | null } = { mtime: 0, value: null };
const luckyCache: { mtime: number; value: LuckyFile | null } = { mtime: 0, value: null };

export function getCardSet(): CardSet {
  return readJson(CARDS_PATH, cardsCache).set;
}

export function getCards(): CardRecord[] {
  return readJson(CARDS_PATH, cardsCache).cards;
}

export function getLuckyConfig(): LuckyConfig {
  return readJson(LUCKY_PATH, luckyCache);
}

export function findCard(id: string): CardRecord | undefined {
  return getCards().find((c) => c.id === id);
}

export function findDesign(designId: string): CardDesign | undefined {
  return getCardSet().designs.find((d) => d.id === designId);
}

/** 럭키 목록은 서버에서만 조회한다. */
export function findLucky(card: Pick<CardRecord, "designId" | "serial">): LuckyNumber | undefined {
  return getLuckyConfig().numbers.find((n) => n.designId === card.designId && n.serial === card.serial);
}

/** 카드 식별자 규칙: 번호가 바뀌면 식별자와 주소도 함께 바뀐다. */
export function makeCardId(setId: string, designId: string, serial: string): string {
  const prefix = setId.replace(/-v\d+$/, "");
  return `${prefix}-${designId}-${serial}`;
}

function writeJsonAtomic(file: string, data: unknown) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  renameSync(tmp, file);
}

/**
 * 관리 화면에서 카드 번호를 고친다.
 * 카드 식별자를 다시 만들고, 그 디자인이 럭키 목록에 있으면 럭키 번호도 같이 옮긴다.
 * 반환: 바뀐 카드(이전 식별자 포함).
 */
export function updateCardSerial(designId: string, serial: string): { before: CardRecord; after: CardRecord } {
  if (!/^\d{4}$/.test(serial)) throw new Error("번호는 숫자 4자리여야 합니다.");
  const file = readJson(CARDS_PATH, cardsCache);
  const idx = file.cards.findIndex((c) => c.designId === designId);
  if (idx < 0) throw new Error("카드를 찾을 수 없습니다.");
  const before = file.cards[idx];
  const duplicate = file.cards.some((c, i) => i !== idx && c.serial === serial);
  if (duplicate) throw new Error("다른 카드가 이미 쓰는 번호입니다.");

  const member = file.set.designs.find((d) => d.id === designId)?.member ?? designId;
  const after: CardRecord = {
    ...before,
    id: makeCardId(file.set.id, designId, serial),
    serial,
    meaning: designId === "group" ? "발매일 번호" : `${member} 생일 번호`,
  };
  delete after.serialNote;
  const nextCards = [...file.cards];
  nextCards[idx] = after;
  writeJsonAtomic(CARDS_PATH, { ...file, cards: nextCards });

  const lucky = readJson(LUCKY_PATH, luckyCache);
  const touched = lucky.numbers.some((n) => n.designId === designId && n.serial === before.serial);
  if (touched) {
    const numbers = lucky.numbers.map((n) => (n.designId === designId && n.serial === before.serial ? { ...n, serial } : n));
    writeJsonAtomic(LUCKY_PATH, { ...lucky, numbers });
  }
  return { before, after };
}
