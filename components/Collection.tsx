"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isSetComplete, useCollection } from "@/lib/collection";
import { BottomNav } from "./BottomNav";
import { cardHref } from "@/lib/card-link";
import type { PublicSet } from "@/lib/public-set";
import { BottomSheet, PrimaryButton, SecondaryButton, Toast, TopBar } from "./ui";

export function Collection({ set }: { set: PublicSet }) {
  const items = useCollection((s) => s.items);
  const hydrate = useCollection((s) => s.hydrate);
  const hydrated = useCollection((s) => s.hydrated);
  const clear = useCollection((s) => s.clear);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"member" | "serial">("member");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ownedByDesign = useMemo(() => {
    const map = new Map<string, (typeof items)[number][]>();
    for (const it of items) {
      if (it.setId !== set.id) continue;
      map.set(it.designId, [...(map.get(it.designId) ?? []), it]);
    }
    return map;
  }, [items, set.id]);

  /** 번호별 보기: 이 세트의 카드 전부를 번호 오름차순으로 */
  const bySerial = useMemo(
    () =>
      items
        .filter((c) => c.setId === set.id)
        .slice()
        .sort(
          (a, b) =>
            a.serial.localeCompare(b.serial) ||
            a.registeredAt.localeCompare(b.registeredAt),
        ),
    [items, set.id],
  );

  const ownedCount = ownedByDesign.size;
  const total = set.designs.length;
  const complete = isSetComplete(
    items,
    set.id,
    set.designs.map((d) => d.id),
  );
  const lastCard = items[items.length - 1];

  // 세트 완성 축하 연출은 기기당 한 번만. 도감을 비우면 다시 볼 수 있다.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!hydrated || !complete) return;
    const key = `lnc.celebrated.${set.id}`;
    try {
      if (window.localStorage.getItem(key) === "1") return;
      window.localStorage.setItem(key, "1");
    } catch {
      // 저장 실패해도 연출은 보여 준다
    }
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 2600);
    return () => clearTimeout(t);
  }, [hydrated, complete, set.id]);

  return (
    <div className="phone flex flex-col">
      <TopBar
        title="내 도감"
        back={cardHref(lastCard?.cardId, lastCard?.tagToken) ?? "/"}
        right={
          items.length > 0 ? (
            <button
              type="button"
              className="text-[13px] text-ink-3"
              onClick={() => setConfirmOpen(true)}
            >
              비우기
            </button>
          ) : null
        }
      />

      <main className="flex-1 px-5 pb-[112px] pt-6">
        <section className="relative overflow-hidden rounded-3xl bg-paper-2 p-5">
          {set.groupImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={set.groupImage}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_20%] opacity-55"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper-2 via-paper-2/85 to-paper-2/20" />
            </>
          )}
          <div className="relative">
            <p className="font-wide text-[10px] uppercase tracking-[0.2em] text-accent">
              {set.artist} · {set.album.replace(/[.*]/, "").trim()}
            </p>
            <h2 className="mt-1 text-[19px] font-bold tracking-tight">
              {set.name}
            </h2>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[13px] text-ink-2">세트 완성률</p>
              <p className="tnum text-[26px] font-bold leading-none tracking-tight">
                {hydrated ? ownedCount : 0}
                <span className="text-[15px] font-medium text-ink-3">
                  {" "}
                  / {total}장
                </span>
              </p>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: complete
                    ? "linear-gradient(90deg,#e3bd5c,#a87f25)"
                    : "var(--color-accent)",
                }}
                initial={{ width: 0 }}
                animate={{
                  width: `${hydrated ? (ownedCount / total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
            {complete && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={
                  celebrate
                    ? { opacity: 1, y: 0, scale: [1, 1.03, 1] }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={
                  celebrate
                    ? { duration: 0.7, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }
                    : undefined
                }
                className={`relative mt-4 overflow-hidden rounded-2xl bg-ink px-4 py-3.5 text-paper ${celebrate ? "ring-2 ring-gold-2" : ""}`}
              >
                <AnimatePresence>
                  {celebrate && (
                    <motion.span
                      key="shine"
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-gold-1/40 to-transparent"
                      initial={{ left: "-40%" }}
                      animate={{ left: "120%" }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 1.1,
                        delay: 0.5,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </AnimatePresence>
                <p className="text-[14px] font-semibold">세트를 모두 모았어요</p>
                <p className="mt-0.5 text-[12.5px] text-paper/70">
                  7장을 모두 모은 분께 드리는 이벤트가 있어요
                </p>
                <button
                  type="button"
                  onClick={() => setEventOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-paper/85 underline-offset-4 active:underline"
                >
                  이벤트 안내 보기
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </motion.div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink-2">
              {view === "member" ? "멤버별" : "번호별"}
            </p>
            <div className="flex rounded-full bg-paper-2 p-1 text-[12.5px] font-medium">
              {(["member", "serial"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`rounded-full px-3 py-1 transition-colors ${view === v ? "bg-ink text-paper" : "text-ink-2"}`}
                >
                  {v === "member" ? "멤버별" : "번호별"}
                </button>
              ))}
            </div>
          </div>

          {view === "serial" ? (
            bySerial.length === 0 ? (
              <p className="py-6 text-center text-[13.5px] text-ink-3">
                아직 담긴 카드가 없어요
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
                {bySerial.map((c) => {
                  const href = cardHref(c.cardId, c.tagToken);
                  const row = (
                    <>
                      <div className="card-gloss relative aspect-[55/85] w-[38px] shrink-0 overflow-hidden rounded-[5px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.image}
                          alt=""
                          className="h-full w-full object-cover object-top"
                          draggable={false}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="tnum text-[16px] font-bold leading-tight tracking-tight">
                          No. {c.serial}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">
                          {c.member} ·{" "}
                          {c.registeredAt.slice(0, 10).replace(/-/g, ".")} 등록
                        </p>
                      </div>
                      {c.badge === "lucky" && (
                        <span className="badge-gold shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-[0.1em]">
                          LUCKY
                        </span>
                      )}
                      {c.badge === "meaning" && (
                        <span className="badge-silver shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-tight">
                          {c.meaningLabel ?? "의미 번호"}
                        </span>
                      )}
                    </>
                  );
                  const cls =
                    "flex items-center gap-3 px-3.5 py-3 active:bg-paper-2";
                  return (
                    <li key={c.cardId}>
                      {href ? (
                        <Link href={href} className={cls}>
                          {row}
                        </Link>
                      ) : (
                        <div className={cls}>{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <div className="grid grid-cols-3 gap-x-3 gap-y-5">
              {set.designs.map((d) => {
                const owned = ownedByDesign.get(d.id) ?? [];
                const first = owned[0];
                return (
                  <div key={d.id} className="flex flex-col items-center">
                    {/* 미보유면 홈 격자와 같은 방식: 카드 틀은 선명하게, 안쪽 그림만 흐린다 */}
                    <div
                      className={`card-gloss relative aspect-[55/85] w-full overflow-hidden rounded-[10px] ${
                        first
                          ? "shadow-soft"
                          : "bg-[#2a2826] ring-1 ring-white/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={first?.image ?? d.image}
                        alt={`${d.member} 카드`}
                        className={`h-full w-full object-cover object-top ${
                          first ? "" : "scale-110 opacity-40 grayscale-[80%] blur-[9px] brightness-[0.6]"
                        }`}
                        draggable={false}
                      />
                      {first?.badge === "lucky" && (
                        <span className="badge-gold absolute left-1/2 top-1.5 z-[2] -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-extrabold tracking-[0.1em]">
                          LUCKY
                        </span>
                      )}
                      {first?.badge === "meaning" && (
                        <span className="badge-silver absolute left-1/2 top-1.5 z-[2] -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-tight">
                          {first.meaningLabel ?? "의미 번호"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] font-semibold">{d.member}</p>
                    <p className="tnum text-[11.5px] text-ink-3">
                      {first
                        ? `No. ${first.serial}${owned.length > 1 ? ` 외 ${owned.length - 1}` : ""}`
                        : "아직 없어요"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {items.length === 0 && hydrated && (
          <p className="mt-8 text-center text-[13.5px] leading-relaxed text-ink-3">
            카드를 폰에 대면 자동으로 이곳에 담겨요.
            <br />
            도감은 이 기기 안에만 저장돼요.
          </p>
        )}

        <div className="mt-8">
          <SecondaryButton
            href={lastCard ? `/studio?card=${lastCard.cardId}` : "/studio"}
          >
            함께 찍기
          </SecondaryButton>
        </div>
      </main>
      <BottomNav />

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-tight">
          도감을 비울까요?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          이 기기에 저장된 카드 {items.length}장이 도감에서 지워져요. 카드를
          다시 대면 다시 담을 수 있어요.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setConfirmOpen(false)}>
            취소
          </SecondaryButton>
          <PrimaryButton
            className="h-[52px]"
            onClick={() => {
              clear();
              setConfirmOpen(false);
            }}
          >
            비우기
          </PrimaryButton>
        </div>
      </BottomSheet>

      <BottomSheet open={eventOpen} onClose={() => setEventOpen(false)}>
        <SetEventSheet
          event={set.setEvent}
          onEnter={() => {
            setToast("기획사 응모 페이지로 연결됩니다");
            setTimeout(() => setToast(null), 2200);
          }}
        />
      </BottomSheet>
      <Toast message={toast} />
    </div>
  );
}

/** 세트 완성 이벤트 안내. 7장(멤버 6 + 단체 1)을 같은 기기 도감에 전부 등록했을 때만 열린다. */
function SetEventSheet({
  event,
  onEnter,
}: {
  event: PublicSet["setEvent"];
  onEnter: () => void;
}) {
  const fmt = (d: string) => d.replace(/-/g, ".");
  return (
    <div>
      <span className="badge-gold inline-flex h-7 items-center rounded-full px-2.5 text-[10.5px] font-extrabold tracking-[0.12em]">
        SET COMPLETE
      </span>
      <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
        7장을 모두 모은 분께 드려요
      </h2>
      <p className="mt-1.5 text-[14px] text-ink-2">
        응모한 분 중 {event.winners}명에게 소정의 사은품을 드려요. 응모는
        카드가 처음 등록된 이 기기에서만 할 수 있어요.
      </p>
      <dl className="mt-5 flex flex-col gap-4 text-[14.5px]">
        <div>
          <dt className="text-[12.5px] text-ink-3">사은품</dt>
          <dd className="mt-0.5 font-medium">{event.gift}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-ink-3">응모 방법</dt>
          <dd className="mt-0.5 font-medium">
            응모하기를 눌러 기획사 응모 페이지에서 수령 정보를 입력하면 안내
            문자가 발송됩니다.
          </dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-ink-3">응모 마감</dt>
          <dd className="mt-0.5 font-medium tnum">{fmt(event.entryDeadline)}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-ink-3">발표</dt>
          <dd className="mt-0.5 font-medium tnum">
            {fmt(event.announceAt)} 응모 시 입력한 연락처로 개별 안내
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <PrimaryButton onClick={onEnter}>응모하기</PrimaryButton>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-3">
          선정과 지급은 기획사가 맡습니다. 자세한 기준은 럭키 넘버 안내
          페이지에 적혀 있습니다.
        </p>
      </div>
    </div>
  );
}
