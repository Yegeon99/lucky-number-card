import "server-only";
import { findCard, findDesign, findLucky, getCardSet, getLuckyConfig, type CardRecord } from "@/lib/catalog";
import { getRegistration, recordVisit } from "@/lib/store";
import type { CardPublicInfo, VerifyInput, VerifyResult } from "./types";

export type { VerifyInput, VerifyResult, VerifyStatus, CardPublicInfo, LuckyInfo, MeaningInfo } from "./types";

/**
 * 정품 검증 진입점.
 * 정식 단계에서는 아래 한 줄을 verifyWithSecureChip 으로 바꾸기만 하면 된다.
 */
export async function verifyCard(input: VerifyInput): Promise<VerifyResult> {
  return verifyMock(input);
}

/** 데모용 토큰 형식: 영문 대문자와 숫자 8자 이상 */
const TOKEN_PATTERN = /^[A-Z0-9]{8,}$/;

/**
 * 데모 모의 검증.
 * 카드 목록에 있고 토큰이 그 카드에 기록된 값과 정확히 같으면 정품.
 * 목록에 없거나, 형식이 틀리거나, 다른 카드의 토큰이면 확인 불가.
 * 다른 기기 토큰으로 이미 등록되어 있으면 다른 기기 등록.
 */
async function verifyMock(input: VerifyInput): Promise<VerifyResult> {
  const card = findCard(input.cardId);
  if (!card || !input.tagToken || !TOKEN_PATTERN.test(input.tagToken) || input.tagToken !== card.tagToken) {
    return { status: "unverified", card: null };
  }
  return resolveRegistration(card, input.deviceToken);
}

/**
 * 정식 검증 자리. 데모에서는 호출하지 않는다.
 * 교체 시 구현할 것: 보안 칩 서명 확인, 읽기 횟수 역행 차단.
 * 입력·출력 형태는 verifyMock 과 동일하게 유지한다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verifyWithSecureChip(_input: VerifyInput): Promise<VerifyResult> {
  throw new Error("정식 검증은 아직 연결되지 않았습니다.");
}

/** 카드가 정품일 때 등록 상태를 판정하고 확인 기록을 남긴다. */
async function resolveRegistration(card: CardRecord, deviceToken: string): Promise<VerifyResult> {
  const publicInfo = toPublicInfo(card);
  const lucky = findLucky(card);
  const meaning = card.meaning ? { label: card.meaning } : null;

  const existing = await getRegistration(card.id);
  if (existing && existing.deviceToken !== deviceToken) {
    // 다른 기기 등록: 정품 사실은 알려 주되 도감 등록과 혜택 확인은 잠근다.
    const { registration } = await recordVisit(card.id, deviceToken);
    return {
      status: "other_device",
      card: publicInfo,
      isFirstRegistrant: false,
      justRegistered: false,
      registeredAt: registration.registeredAt,
      viewCount: registration.viewCount,
      lucky: {
        isLuckyCard: Boolean(lucky),
        unlocked: false,
        reveal: false,
      },
      meaning,
    };
  }

  const { registration, created } = await recordVisit(card.id, deviceToken);
  return {
    status: "verified",
    card: publicInfo,
    isFirstRegistrant: true,
    justRegistered: created,
    registeredAt: registration.registeredAt,
    viewCount: registration.viewCount,
    lucky: {
      isLuckyCard: Boolean(lucky),
      // 혜택 확인은 첫 등록자에게만 열린다.
      unlocked: Boolean(lucky),
      // 연출은 첫 등록이 이 요청에서 이루어졌을 때 한 번만.
      reveal: Boolean(lucky) && created,
      grade: lucky?.grade,
      benefit: lucky ? getLuckyConfig().grades.find((g) => g.grade === lucky.grade)?.benefit : undefined,
      entryDeadline: lucky ? getLuckyConfig().entryDeadline : undefined,
    },
    meaning,
  };
}

function toPublicInfo(card: CardRecord): CardPublicInfo {
  const cardSet = getCardSet();
  const design = findDesign(card.designId);
  return {
    id: card.id,
    serial: card.serial,
    issued: cardSet.issuedPerDesign,
    artist: cardSet.artist,
    album: cardSet.album,
    member: design?.member ?? "",
    nameEn: design?.nameEn ?? "",
    designId: card.designId,
    setId: cardSet.id,
    setName: cardSet.name,
    issuedAt: cardSet.issuedAt,
    manufacturer: cardSet.manufacturer,
    image: card.image,
    frameId: card.frameId,
    accent: design?.accent ?? "#333333",
    logoImage: cardSet.logoImage,
  };
}
