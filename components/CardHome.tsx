"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDeviceToken } from "@/lib/device";
import { isAdminMode } from "@/lib/admin-mode";
import { useCollection } from "@/lib/collection";
import { saveSessionCard } from "@/lib/session-card";
import type { VerifyResult } from "@/lib/verify/types";
import { BottomSheet, PrimaryButton, SecondaryButton, Toast } from "./ui";

type Phase = "loading" | "done" | "error";

const CONTACT_MAIL = "mailto:lucky@bigglz.co.kr";

export function CardHome({
  cardId,
  tagToken,
}: {
  cardId: string;
  tagToken: string | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [collected, setCollected] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const startedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addToCollection = useCollection((s) => s.add);
  const hydrate = useCollection((s) => s.hydrate);
  const items = useCollection((s) => s.items);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const verify = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagToken, deviceToken: getDeviceToken() }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as VerifyResult;
      setResult(data);
      setPhase("done");

      if (data.status === "verified" || data.status === "other_device") {
        saveSessionCard({
          card: data.card,
          tagToken,
          luckyUnlocked: data.status === "verified" && data.lucky.unlocked,
          status: data.status,
        });
      }

      // 정품 확인 + 이 기기가 첫 등록자일 때만 도감에 자동 등록한다.
      if (data.status === "verified" && data.isFirstRegistrant) {
        const { added } = addToCollection({
          cardId: data.card.id,
          designId: data.card.designId,
          setId: data.card.setId,
          serial: data.card.serial,
          member: data.card.member,
          image: data.card.image,
          accent: data.card.accent,
          badge: data.lucky.isLuckyCard
            ? "lucky"
            : data.meaning
              ? "meaning"
              : "none",
          meaningLabel: data.meaning?.label,
          registeredAt: data.registeredAt ?? new Date().toISOString(),
          tagToken: tagToken ?? undefined,
        });
        setCollected(true);
        if (added) {
          // 럭키 연출(1초 뒤 시작, 1.5초 안에 끝)과 겹치지 않게 럭키 카드는 토스트를 연출 뒤로 미룬다.
          const delay = data.lucky.reveal ? 2600 : 500;
          setTimeout(() => showToast("내 도감에 담았어요"), delay);
        }
      }
    } catch {
      setPhase("error");
    }
  }, [cardId, tagToken, addToCollection, showToast]);

  useEffect(() => {
    hydrate();
    setAdminMode(isAdminMode());
    if (startedRef.current) return;
    startedRef.current = true;
    void verify();
  }, [verify, hydrate]);

  useEffect(() => {
    if (result && result.status !== "unverified") {
      setCollected(items.some((c) => c.cardId === result.card.id));
    }
  }, [items, result]);

  const ok = result && result.status !== "unverified" ? result : null;
  const status: "loading" | "verified" | "other_device" | "unverified" =
    phase === "loading" ? "loading" : ok ? ok.status : "unverified";

  const goStudio = () => {
    router.push(`/studio?card=${encodeURIComponent(cardId)}`);
  };

  const onBadgeTap = () => {
    if (!ok) return;
    if (ok.status === "verified" && ok.lucky.unlocked) {
      setSheetOpen(true);
    } else {
      // 첫 등록자가 아닌 태그: 혜택 안내는 열리지 않는다.
      showToast("이 카드는 럭키 넘버 카드입니다");
    }
  };

  return (
    <div className="phone flex flex-col">
      <StatusBar
        status={status}
        serial={ok?.card.serial}
        issued={ok?.card.issued}
        open={detailOpen}
        onToggle={() => ok && setDetailOpen((v) => !v)}
      >
        {ok && detailOpen && (
          <DetailPanel
            artist={ok.card.artist}
            album={ok.card.album}
            member={ok.card.member}
            serial={ok.card.serial}
            issued={ok.card.issued}
            issuedAt={ok.card.issuedAt}
            manufacturer={ok.card.manufacturer}
            collected={collected}
            viewCount={ok.viewCount}
          />
        )}
      </StatusBar>

      <main className="flex flex-1 flex-col px-6 pt-7 safe-bottom">
        {/* 카드 컷 */}
        <div className="flex justify-center">
          <CardVisual
            image={ok?.card.image ?? null}
            member={ok?.card.member ?? ""}
            accent={ok?.card.accent ?? "#d8d8d8"}
            loading={status === "loading"}
          />
        </div>

        {/* 번호와 배지 자리 */}
        <div className="mt-7 min-h-[76px]">
          {ok ? (
            <SerialWithBadges
              serial={ok.card.serial}
              issued={ok.card.issued}
              lucky={ok.lucky}
              meaning={ok.meaning}
              status={ok.status}
              onBadgeTap={onBadgeTap}
            />
          ) : status === "unverified" ? (
            <div className="text-center">
              <p className="text-[22px] font-semibold tracking-tight text-ink">
                확인할 수 없는 카드입니다
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">
                카드를 폰 뒷면 위쪽에 다시 대거나 아래 재시도를 눌러 주세요.
              </p>
            </div>
          ) : (
            <div className="mx-auto h-9 w-40 animate-pulse rounded-lg bg-paper-2" />
          )}
        </div>

        {/* 주 동작 */}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          {status === "unverified" ? (
            <>
              {/* 관리자 모드: 카드 확인 없이도 프레임 검수용으로 함께 찍기를 연다. 정품 표시와 도감은 그대로 잠김. */}
              <PrimaryButton onClick={goStudio} disabled={!adminMode}>
                {adminMode && <CameraIcon />}
                <span className={adminMode ? "ml-2" : ""}>함께 찍기</span>
              </PrimaryButton>
              {adminMode && (
                <p className="px-1 text-center text-[12.5px] leading-relaxed text-warn">
                  관리자 모드: 카드 확인 없이 함께 찍기를 열어요. 정품 표시와
                  도감 등록은 되지 않아요.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <SecondaryButton onClick={() => void verify()}>
                  재시도
                </SecondaryButton>
                <SecondaryButton href={CONTACT_MAIL}>문의</SecondaryButton>
              </div>
            </>
          ) : (
            <>
              <PrimaryButton onClick={goStudio} disabled={status === "loading"}>
                <CameraIcon />
                <span className="ml-2">함께 찍기</span>
              </PrimaryButton>
              <SecondaryButton href="/collection">내 도감</SecondaryButton>
              {status === "other_device" && (
                <p className="px-1 text-center text-[12.5px] leading-relaxed text-ink-3">
                  이 카드는 처음 등록한 기기의 도감에 담겨 있어요. 사진은
                  여기서도 찍을 수 있어요.
                </p>
              )}
            </>
          )}
          <div className="mt-2 flex items-center justify-center gap-5 text-[12.5px] text-ink-3">
            <Link
              href="/notice"
              className="underline-offset-4 active:underline"
            >
              럭키 넘버 안내
            </Link>
            <span className="h-3 w-px bg-line" />
            <a
              href={CONTACT_MAIL}
              className="underline-offset-4 active:underline"
            >
              문의
            </a>
          </div>
        </div>
      </main>

      <Toast message={toast} />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {ok && ok.status === "verified" && (
          <LuckySheet
            benefit={ok.lucky.benefit ?? ""}
            grade={ok.lucky.grade ?? ""}
            reason={ok.meaning?.label ?? ""}
            deadline={ok.lucky.entryDeadline ?? ""}
            onNotice={() => showToast("기획사 응모 페이지로 연결됩니다")}
          />
        )}
      </BottomSheet>
    </div>
  );
}

/* 상단 고정 띠 */
function StatusBar({
  status,
  serial,
  issued,
  open,
  onToggle,
  children,
}: {
  status: "loading" | "verified" | "other_device" | "unverified";
  serial?: string;
  issued?: number;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const tone =
    status === "verified"
      ? "bg-ok-soft text-ok"
      : status === "other_device"
        ? "bg-warn-soft text-warn"
        : status === "unverified"
          ? "bg-bad-soft text-bad"
          : "bg-paper-2 text-ink-3";

  const label =
    status === "verified" ? (
      <>
        정품 <span className="mx-1.5 opacity-50">·</span> No.{" "}
        <span className="tnum">{serial}</span>
        <span className="opacity-60"> / </span>
        <span className="tnum">{issued}</span>
      </>
    ) : status === "other_device" ? (
      <>
        다른 기기에서 등록된 카드입니다{" "}
        <span className="mx-1.5 opacity-50">·</span> No.{" "}
        <span className="tnum">{serial}</span>
      </>
    ) : status === "unverified" ? (
      "확인할 수 없는 카드입니다"
    ) : (
      "카드를 확인하고 있어요"
    );

  return (
    <div className={`sticky top-0 z-30 ${tone}`}>
      <div className="flex h-12 items-center">
        <Link
          href="/"
          aria-label="뒤로"
          className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-black/10"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-12 min-w-0 flex-1 items-center justify-between pl-1 pr-4 text-left"
          aria-expanded={open}
          aria-label={open ? "카드 상세 정보 닫기" : "카드 상세 정보 열기"}
          disabled={status === "loading" || status === "unverified"}
        >
          <span className="flex min-w-0 items-center gap-2 text-[14px] font-semibold tracking-tight">
            <StatusIcon status={status} />
            <span className="truncate">{label}</span>
          </span>
          {status !== "loading" && status !== "unverified" && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusIcon({
  status,
}: {
  status: "loading" | "verified" | "other_device" | "unverified";
}) {
  if (status === "loading") {
    return (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
    );
  }
  if (status === "verified") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.5l2.4 2 3.1-.4.8 3 2.7 1.6-1.2 2.9 1.2 2.9-2.7 1.6-.8 3-3.1-.4-2.4 2-2.4-2-3.1.4-.8-3L3 14.5l1.2-2.9L3 8.7l2.7-1.6.8-3 3.1.4z" />
        <path d="M8.5 12l2.3 2.3L15.5 9.5" />
      </svg>
    );
  }
  if (status === "other_device") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <path d="M11 18h2" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

function DetailPanel({
  artist,
  album,
  member,
  serial,
  issued,
  issuedAt,
  manufacturer,
  collected,
  viewCount,
}: {
  artist: string;
  album: string;
  member: string;
  serial: string;
  issued: number;
  issuedAt: string;
  manufacturer: string;
  collected: boolean;
  viewCount: number;
}) {
  const rows: [string, React.ReactNode][] = [
    ["아티스트", `${artist} ${member}`],
    ["앨범", album],
    [
      "순번",
      <span key="s" className="tnum">
        {Number(serial)}번째 / {issued}장
      </span>,
    ],
    ["발행일", issuedAt.replace(/-/g, ".")],
    ["제작", manufacturer],
    ["내 도감", collected ? "등록됨" : "등록 안 됨"],
    [
      "누적 확인",
      <span key="v" className="tnum">
        {viewCount}회
      </span>,
    ],
  ];
  return (
    <dl className="grid grid-cols-[72px_1fr] gap-y-2 border-t border-white/10 px-4 pb-4 pt-3 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="opacity-60">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* 카드 컷: 실물 포토카드 비율 55×85 */
function CardVisual({
  image,
  member,
  accent,
  loading,
}: {
  image: string | null;
  member: string;
  accent: string;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="card-gloss relative aspect-[55/85] w-[64%] max-w-[250px] overflow-hidden rounded-card shadow-card"
      style={{
        background: loading
          ? "#eee"
          : `linear-gradient(160deg, ${accent}22, ${accent}66)`,
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={`${member} 카드 컷`}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-3">
          {!loading && (
            <>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <circle cx="9" cy="10" r="1.8" />
                <path d="M21 16l-5-5-8 8" />
              </svg>
              <span className="text-[12px]">샘플 이미지 자리</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* 카드 번호 + 배지 자리 (럭키 연출, 의미 번호) */
function SerialWithBadges({
  serial,
  issued,
  lucky,
  meaning,
  status,
  onBadgeTap,
}: {
  serial: string;
  issued: number;
  lucky: { isLuckyCard: boolean; unlocked: boolean; reveal: boolean };
  meaning: { label: string } | null;
  status: "verified" | "other_device";
  onBadgeTap: () => void;
}) {
  // 럭키 연출 조건: 정품 확인 + 이 기기가 첫 등록자 + 럭키 카드.
  // 세 조건이 모두 맞을 때만 (lucky.reveal) 지연 연출을 한다.
  // 럭키가 아닌 카드에는 배지도 문구도 어떤 것도 표시하지 않는다.
  const [goldOn, setGoldOn] = useState(
    lucky.isLuckyCard && !lucky.reveal && lucky.unlocked,
  );
  const [badgeOn, setBadgeOn] = useState(lucky.isLuckyCard && !lucky.reveal);

  useEffect(() => {
    if (!lucky.reveal) return;
    // 카드 홈이 완전히 그려진 뒤 1초 대기 후 연출 시작. 전체 1.5초 이내.
    const t = setTimeout(() => {
      setBadgeOn(true);
      setGoldOn(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [lucky.reveal]);

  const goldNumber = lucky.isLuckyCard && status === "verified" && goldOn;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="text-[15px] font-medium text-ink-3">No.</span>
        <motion.span
          className={`font-wide text-[40px] leading-none ${goldNumber ? "text-gold" : "text-ink"}`}
          animate={{ scale: goldNumber && lucky.reveal ? [1, 1.04, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          {serial}
        </motion.span>
        <span className="tnum text-[15px] font-medium text-ink-3">
          / {issued}
        </span>
      </div>

      {/* 배지 줄: 금색 LUCKY 가 앞, 은색 의미 번호가 뒤. 럭키가 아니면 금색 자리는 비어 있다. */}
      <div className="relative mt-3.5 flex h-8 items-center justify-center gap-2 overflow-hidden px-2">
        <AnimatePresence>
          {lucky.isLuckyCard && badgeOn && (
            <motion.button
              key="lucky"
              type="button"
              onClick={onBadgeTap}
              layout
              initial={lucky.reveal ? { x: 72, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="badge-gold flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[10.5px] font-extrabold tracking-[0.1em]"
              aria-label="LUCKY NUMBER"
            >
              <StarIcon />
              LUCKY NUMBER
            </motion.button>
          )}
        </AnimatePresence>
        {meaning && !lucky.isLuckyCard && (
          <motion.span
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="badge-silver flex h-8 shrink-0 items-center rounded-full px-3 text-[12px] font-bold tracking-tight"
          >
            {meaning.label}
          </motion.span>
        )}
      </div>
    </div>
  );
}

function LuckySheet({
  benefit,
  grade,
  reason,
  deadline,
  onNotice,
}: {
  benefit: string;
  grade: string;
  /** 럭키인 이유. 예: "루카 생일 번호" */
  reason: string;
  deadline: string;
  onNotice: () => void;
}) {
  return (
    <div>
      <span className="badge-gold inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[10.5px] font-extrabold tracking-[0.12em]">
        <StarIcon /> LUCKY NUMBER{" "}
        {grade && <span className="ml-1 opacity-80">{grade}등급</span>}
      </span>
      <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
        이 번호에는 플러스 혜택이 있어요
      </h2>
      {reason && (
        <p className="mt-1.5 text-[14px] text-ink-2">
          {reason}예요. 이 번호를 처음 등록한 분께 드려요.
        </p>
      )}
      <dl className="mt-5 flex flex-col gap-4 text-[14.5px]">
        <div>
          <dt className="text-[12.5px] text-ink-3">혜택 내용</dt>
          <dd className="mt-0.5 font-medium">{benefit}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-ink-3">수령 방법</dt>
          <dd className="mt-0.5 font-medium">
            응모하기를 눌러 기획사 응모 페이지에서 수령 정보를 입력하면 안내
            문자가 발송됩니다.
          </dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-ink-3">응모 마감</dt>
          <dd className="mt-0.5 font-medium tnum">
            {deadline.replace(/-/g, ".")}
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <PrimaryButton onClick={onNotice}>응모하기</PrimaryButton>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-3">
          혜택 운영과 배송은 기획사가 맡습니다. 이 화면은 카드가 처음 등록된
          기기에서만 열립니다.
        </p>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l2.6 6.4 6.9.5-5.3 4.5 1.7 6.7L12 16.5 6.1 20.1l1.7-6.7-5.3-4.5 6.9-.5z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
