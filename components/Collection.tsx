"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isSetComplete, useCollection } from "@/lib/collection";
import { cardHref } from "@/lib/card-link";
import type { PublicSet } from "@/lib/public-set";
import { BottomSheet, PrimaryButton, SecondaryButton, TopBar } from "./ui";

export function Collection({ set }: { set: PublicSet }) {
  const items = useCollection((s) => s.items);
  const hydrate = useCollection((s) => s.hydrate);
  const hydrated = useCollection((s) => s.hydrated);
  const clear = useCollection((s) => s.clear);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const ownedCount = ownedByDesign.size;
  const total = set.designs.length;
  const complete = isSetComplete(items, set.id, set.designs.map((d) => d.id));
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
            <button type="button" className="text-[13px] text-ink-3" onClick={() => setConfirmOpen(true)}>
              비우기
            </button>
          ) : null
        }
      />

      <main className="flex-1 px-5 pt-6 safe-bottom">
        <section className="relative overflow-hidden rounded-3xl bg-paper-2 p-5">
          {set.groupImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={set.groupImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_20%] opacity-55" draggable={false} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper-2 via-paper-2/85 to-paper-2/20" />
            </>
          )}
          <div className="relative">
          <p className="font-wide text-[10px] uppercase tracking-[0.2em] text-accent">{set.artist} · {set.album.replace(/[.*]/, "").trim()}</p>
          <h2 className="mt-1 text-[19px] font-bold tracking-tight">{set.name}</h2>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-[13px] text-ink-2">세트 완성률</p>
            <p className="tnum text-[26px] font-bold leading-none tracking-tight">
              {hydrated ? ownedCount : 0}
              <span className="text-[15px] font-medium text-ink-3"> / {total}장</span>
            </p>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: complete ? "linear-gradient(90deg,#e3bd5c,#a87f25)" : "var(--color-accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${hydrated ? (ownedCount / total) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={celebrate ? { opacity: 1, y: 0, scale: [1, 1.03, 1] } : { opacity: 1, y: 0, scale: 1 }}
              transition={celebrate ? { duration: 0.7, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] } : undefined}
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
                    transition={{ duration: 1.1, delay: 0.5, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>
              <p className="text-[14px] font-semibold">세트를 모두 모았어요. 단체 프레임이 열렸어요</p>
              <Link href="/studio" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-paper/80 underline-offset-4 active:underline">
                함께 찍기로 가기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </motion.div>
          )}
          </div>
        </section>

        <section className="mt-6">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {set.designs.map((d) => {
              const owned = ownedByDesign.get(d.id) ?? [];
              const first = owned[0];
              return (
                <div key={d.id} className="flex flex-col items-center">
                  <div
                    className={`card-gloss relative aspect-[55/85] w-full overflow-hidden rounded-[10px] ${
                      first ? "shadow-soft" : "opacity-45 grayscale-[35%] blur-[1.2px]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={first?.image ?? d.image} alt={`${d.member} 카드`} className="h-full w-full object-cover object-top" draggable={false} />
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
                    {first ? `No. ${first.serial}${owned.length > 1 ? ` 외 ${owned.length - 1}` : ""}` : "아직 없어요"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {items.length === 0 && hydrated && (
          <p className="mt-8 text-center text-[13.5px] leading-relaxed text-ink-3">
            카드를 폰에 대면 자동으로 이곳에 담겨요.
            <br />
            도감은 이 기기 안에만 저장돼요.
          </p>
        )}

        <div className="mt-8">
          <SecondaryButton href={lastCard ? `/studio?card=${lastCard.cardId}` : "/studio"}>함께 찍기</SecondaryButton>
        </div>
      </main>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-tight">도감을 비울까요?</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          이 기기에 저장된 카드 {items.length}장이 도감에서 지워져요. 카드를 다시 대면 다시 담을 수 있어요.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setConfirmOpen(false)}>취소</SecondaryButton>
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
    </div>
  );
}
