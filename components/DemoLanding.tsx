"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "./Switch";
import { isAdminMode, setAdminMode } from "@/lib/admin-mode";

type Item = {
  id: string;
  member: string;
  nameEn: string;
  serial: string;
  image: string;
  href: string;
  accent: string;
  /** 관리자 모드 힌트 점에만 쓰인다. 문구로는 쓰지 않는다. */
  hint: "lucky" | "meaning" | null;
};

type Hero = { image: string; artist: string; album: string; albumKo: string };

export function DemoLanding({ items, missingHref, hero, footer }: { items: Item[]; missingHref: string; hero: Hero; footer: string }) {
  const [hints, setHints] = useState(false);

  useEffect(() => {
    setHints(isAdminMode());
  }, []);

  const setHintsPersist = (next: boolean) => {
    setHints(next);
    setAdminMode(next);
  };

  const albumLabel = hero.album.replace(/\[.*\]/, "").trim().toUpperCase();

  return (
    <div className="phone flex flex-col">
      {/* 상단: 앨범 커버 위 워드마크 */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[length:160%_auto] bg-[position:100%_45%] bg-no-repeat"
          style={{ backgroundImage: hero.image ? `url(${hero.image})` : undefined, backgroundColor: "#a8141a" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-paper" aria-hidden />

        <div className="relative px-6 pb-8 pt-7">
          <div className="flex items-start justify-between gap-3">
            <p className="font-wide max-w-[200px] text-[9px] uppercase leading-snug tracking-[0.18em] text-black/80">
              {hero.artist}
              <br />
              {albumLabel}
            </p>
            <div className="-mt-1 shrink-0 rounded-full bg-black/55 px-2 py-1 backdrop-blur">
              <Switch id="admin-mode" label="관리자 모드" checked={hints} onChange={setHintsPersist} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-9 flex items-end gap-4"
          >
            <h1 className="font-wide text-[50px] leading-[0.86] tracking-[-0.02em] text-black">CHOOM</h1>
            {hero.albumKo && <span className="mb-0.5 text-[26px] font-extrabold leading-none text-ink drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{hero.albumKo}</span>}
          </motion.div>

          <div className="mt-6 inline-block bg-black px-3 py-2">
            <p className="text-[22px] font-extrabold leading-none tracking-tight text-ink">럭키 넘버 카드</p>
          </div>
          <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-ink">
            내 포토카드 멤버와 함께 찍는 프레임. 정품은 기본, 럭키 넘버는 덤.
          </p>
        </div>
      </header>

      {/* 안내 */}
      <p className="mt-2 px-6 text-[12.5px] leading-relaxed text-ink-3">
        실제 상품은 카드를 폰에 대면 열립니다. 데모에서는 카드를 눌러 주세요.
      </p>

      {/* 카드 격자 */}
      <main className="px-6 pb-[112px] pt-4">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6">
          {items.map((it, i) => (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <PhotoCard item={it} showHint={hints} />
            </motion.li>
          ))}

          {/* 목록에 없는 카드: 격자의 빈 자리에 같은 크기로 둔다 */}
          <motion.li
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + items.length * 0.05, duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Link href={missingHref} className="block" aria-label="확인 불가 상태 보기">
              <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex aspect-[55/85] w-full flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-ink-3/55 bg-paper-2/40 text-ink-3"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5v5.5M12 16.5h.01" />
                </svg>
                <span className="text-[12.5px] font-medium">확인 불가 상태 보기</span>
              </motion.div>
            </Link>
          </motion.li>
        </ul>

        <p className="mt-8 text-center text-[10.5px] leading-relaxed text-ink-3/70">
          {footer}
          <br />
          이미지는 앨범 공식 공개 화보이며 데모 시연용입니다. 실제 상품 사용은 기획사 승인이 필요합니다.
        </p>
      </main>

      {/* 하단 고정 바 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t-2 border-accent bg-black/88 backdrop-blur-md">
        <div className="flex items-stretch px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
          <BarLink href="/collection" label="내 도감" icon={<BookIcon />} />
          <BarLink href="/notice" label="럭키 안내" icon={<InfoIcon />} />
          <Link
            href="/admin"
            className="flex w-[64px] flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] text-ink-3 active:bg-paper-2"
          >
            <GearIcon />
            관리
          </Link>
        </div>
      </nav>
    </div>
  );
}

function PhotoCard({ item, showHint }: { item: Item; showHint: boolean }) {
  return (
    <Link href={item.href} className="block" aria-label={`${item.member} No. ${item.serial}`}>
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="card-gloss relative aspect-[55/85] w-full overflow-hidden rounded-[14px] bg-paper-3 shadow-card"
      >
        {/* 카드 컷: 앨범 공식 화보 */}
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover object-top" draggable={false} />
        ) : (
          <div className="absolute inset-0" style={{ background: item.accent }} />
        )}

        {/* 관리자 모드 힌트 점 */}
        {showHint && item.hint && (
          <span className={`absolute right-2.5 top-2.5 z-[4] h-2.5 w-2.5 rounded-full ${item.hint === "lucky" ? "dot-gold" : "dot-silver"}`} />
        )}

        {/* 머그샷 이름판 */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-[4] rotate-[-1.5deg] rounded-[3px] bg-placard/92 px-2.5 py-2 text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)]">
          <p className="font-narrow text-[7px] uppercase tracking-[0.18em] text-white/75">Department of Choom</p>
          <p className="font-narrow mt-0.5 text-[17px] font-bold leading-none tracking-[0.02em]">{item.nameEn}</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[10.5px] font-medium text-white/85">{item.member}</span>
            <span className="font-narrow text-[15px] font-bold leading-none">
              <span className="text-[9px] font-semibold text-white/75">NO. </span>
              {item.serial}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function BarLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11.5px] font-medium text-ink-2 active:bg-paper-2">
      {icon}
      {label}
    </Link>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5V5.5M8 7h8M8 10.5h6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
