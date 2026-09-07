# 럭키 넘버 카드 · 데모 v0.1

내 포토카드 멤버와 함께 찍는 프레임. 정품은 기본, 럭키 넘버는 덤.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run dev:https  # https://localhost:3000 (폰에서 카메라를 쓰려면 이쪽)
```

폰에서 같은 와이파이로 보려면 실행 로그에 나오는 Network 주소를 쓴다.
카메라(셀카 찍기)는 브라우저 규칙상 `localhost` 이거나 HTTPS 일 때만 열린다. 폰에서 `192.168.x.x` 주소로 접속할 때는 `npm run dev:https` 로 띄우고, 폰 브라우저의 인증서 경고를 한 번 통과하면 된다. 배포 주소(Vercel)는 자동으로 HTTPS 다.

## 데모 카드 주소 3개

`outputs/demo-urls.txt` 와 `outputs/qr_*.png` 에 저장되어 있다. `npm run qr` 로 다시 만들 수 있다 (`npm run qr -- https://배포주소` 로 배포 주소 기준 재생성).

| 용도 | 주소 |
| --- | --- |
| 정품 일반 | `/c/bm-choom-ruka-0320?t=K7M2QX9RA4TB` |
| 럭키 | `/c/bm-choom-chiquita-0217?t=C4NQ7YB3ZH9J` |
| 단체 카드 | `/c/bm-choom-group-0504?t=R5XC3BQ9WN7E` |
| 확인 불가 시연 | `/c/bm-choom-unknown-9999?t=ZZZZ0000AAAA` |

첫 화면 `/` 에 위 주소가 모두 버튼으로 있다.

## 화면

- `/c/[카드식별자]?t=[토큰]` 카드 홈 (NFC 카드에 기록하는 주소)
- `/studio` 함께 찍기 (내 사진 한 장 + 멤버 누끼)
- `/templates` 멤버별 샘플 템플릿 검수
- `/collection` 내 도감 (브라우저 저장소)
- `/notice` 럭키 넘버 안내 (법적 고지, 사전 공개 해시)
- `/admin` 관리 (비밀번호: `.env.local` 의 `ADMIN_PASSWORD`)

## 교체 지점

- 정품 검증을 정식(보안 칩 서명 확인)으로 바꿀 때: `lib/verify/index.ts` 한 파일. `verifyCard` 안의 `verifyMock` 호출을 `verifyWithSecureChip` 으로 바꾸고 그 함수를 채운다. 입력·출력 형태는 `lib/verify/types.ts` 에 고정되어 있다.
- 서버 저장: `lib/store/` 안에 파일 백엔드(`file.ts`, 로컬용)와 Upstash Redis 백엔드(`redis.ts`, 배포용)가 있다. `UPSTASH_REDIS_REST_URL` 과 `UPSTASH_REDIS_REST_TOKEN` 이 있으면 Redis, 없으면 `data/registrations.json` 파일을 쓴다. 다른 저장소로 바꿀 때는 `lib/store/types.ts` 의 `StoreBackend` 형태에 맞춰 파일 하나를 추가하고 `index.ts` 에서 고르면 된다.
- 이미지: `public/choom/` (CHOOM 공식 공개 화보, 출처 `public/choom/SOURCES.txt`, 재다운로드 `node scripts/fetch-choom.mjs`). 경로는 `data/cards.json` 의 image / cutImage / heroImage / groupImage. 실제 상품 사용은 기획사 승인 필요.
- 카드 목록과 럭키 목록: `data/cards.json`, `data/lucky-numbers.json`. 럭키 목록을 바꾸면 안내 페이지 해시가 자동으로 다시 계산된다.

## 배포 (Vercel)

프로덕션 주소: https://lucky-number-card.vercel.app (프로젝트 `lucky-number-card`, 2026-09-07 첫 배포)

배포 환경은 서버 파일을 쓸 수 없으므로 등록 상태 저장소가 필요하다. Vercel 마켓플레이스의 Upstash Redis 를 붙이면 환경 변수가 자동으로 들어간다.

```bash
npm i -g vercel
vercel login
vercel link                              # 프로젝트 연결 (처음 한 번)
vercel integration add upstash           # Redis 생성. 브라우저 단계가 뜨면 완료 후 계속
vercel env add ADMIN_PASSWORD production # 관리 화면 비밀번호
vercel env pull .env.local --yes         # 로컬에서도 같은 Redis 를 쓰려면
vercel deploy --prod
```

배포 후 `npm run qr -- https://배포주소` 로 QR 을 다시 만들고, 관리 화면(`/admin`)에서 "데모 초기화"를 한 번 눌러 등록 상태를 비운다.
링크 미리보기(카카오톡 등)에 나오는 이미지는 `app/opengraph-image.tsx`, 홈 화면 아이콘은 `app/icon.tsx` 와 `app/apple-icon.tsx` 에서 만든다.

## 점검 스크립트

```bash
npm run typecheck     # 타입 검사
npm run lint          # ESLint
npm test              # 단위 테스트 (검증 3상태, 토큰 대조, 확인 횟수 규칙, 해시)
npm run test:e2e      # 폰 화면 스모크 테스트 21항목 (배포용 빌드 + 3100 포트, 등록 상태는 임시 파일)
npm run check:words   # 금지 단어, 줄표 전수 검색
npm run qr            # 데모 QR 3장 생성
```

`npm run test:e2e` 는 `next build` 를 먼저 돌린다. 빌드가 이미 있으면 `SKIP_BUILD=1 npm run test:e2e` 로 건너뛴다. 실제 `data/registrations.json` 은 건드리지 않으므로 시연용 폰의 첫 등록 상태가 바뀌지 않는다.

## 확인 규칙 (서버)

- 카드 주소의 토큰(`?t=`)은 `data/cards.json` 에 기록된 그 카드의 값과 정확히 같아야 정품이다. 형식만 맞는 다른 토큰은 확인 불가.
- 같은 기기가 30분 안에 같은 카드를 다시 열면(뒤로가기, 새로고침) 누적 확인 횟수를 올리지 않는다. 다른 기기는 바로 올린다.
- 앱 안에서 카드 홈으로 돌아가는 링크(도감, 함께 찍기의 뒤로가기)는 토큰을 붙여 만든다(`lib/card-link.ts`). 토큰을 모르면 첫 화면으로 보낸다.

## 원칙 (코드에 반영됨)

- 사진은 서버로 보내지 않는다. 촬영·불러오기·합성·저장 전부 브라우저 안에서 끝난다. 서버로 가는 요청은 카드 확인 API 하나뿐이다.
- 럭키가 아닌 카드에는 어떤 결과 문구도 없다.
- 럭키 연출은 정품 확인 + 이 기기가 첫 등록자 + 럭키 카드, 세 조건이 모두 맞을 때 한 번만.
