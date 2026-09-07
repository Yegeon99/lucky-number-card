/**
 * 정품 검증 입력·출력 형태.
 * 모의 함수와 정식 함수(보안 칩 서명 확인)가 이 형태를 그대로 공유한다.
 * 화면 코드는 이 파일의 타입만 알면 되고 검증 방식이 바뀌어도 수정하지 않는다.
 */

export type VerifyInput = {
  /** 주소 경로의 카드 식별자. 예: bm-drip-ruka-0412 */
  cardId: string;
  /** 주소 쿼리 t 값. 데모는 임의 토큰, 정식은 칩이 만든 서명 문자열 */
  tagToken: string | null;
  /** 첫 방문 시 브라우저가 만든 기기 토큰. 첫 등록자 판정 기준 */
  deviceToken: string;
};

export type VerifyStatus = "verified" | "unverified" | "other_device";

/** 화면에 내려 보내는 카드 공개 정보. 서버만 아는 값은 넣지 않는다. */
export type CardPublicInfo = {
  id: string;
  serial: string;
  issued: number;
  artist: string;
  album: string;
  member: string;
  /** 영문 표기 (예: RUKA) */
  nameEn: string;
  designId: string;
  setId: string;
  setName: string;
  issuedAt: string;
  manufacturer: string;
  image: string;
  frameId: string;
  accent: string;
  logoImage: string;
};

export type MeaningInfo = {
  label: string;
};

export type LuckyInfo = {
  /** 럭키 카드인지 여부. 등록 여부와 무관하게 정품 카드이면 내려간다. */
  isLuckyCard: boolean;
  /** 혜택 확인 권한. 이 기기가 첫 등록자일 때만 true. */
  unlocked: boolean;
  /** 이 요청에서 첫 등록이 이루어져 연출을 보여야 하는지. */
  reveal: boolean;
  grade?: string;
  benefit?: string;
  entryDeadline?: string;
};

export type VerifyResult =
  | {
      status: "unverified";
      card: null;
    }
  | {
      status: "verified" | "other_device";
      card: CardPublicInfo;
      isFirstRegistrant: boolean;
      justRegistered: boolean;
      registeredAt: string | null;
      viewCount: number;
      lucky: LuckyInfo;
      meaning: MeaningInfo | null;
    };
