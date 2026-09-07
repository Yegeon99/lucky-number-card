/**
 * 서버 저장 모듈의 공통 형태.
 * 저장 항목: 카드별 첫 등록 기기 토큰, 등록 시각, 누적 확인 횟수, 마지막 확인 시각.
 * 백엔드(파일, Redis)는 이 형태만 맞추면 된다.
 */
export type Registration = {
  cardId: string;
  deviceToken: string;
  registeredAt: string;
  viewCount: number;
  lastViewedAt: string;
};

export type StoreBackend = {
  get(cardId: string): Promise<Registration | null>;
  list(): Promise<Registration[]>;
  /** 카드 1건의 등록 상태를 읽고 바꾸는 작업을 직렬로 실행한다. */
  mutate<T>(cardId: string, fn: (current: Registration | null) => Promise<{ next: Registration | null; result: T }>): Promise<T>;
  reset(): Promise<void>;
};
