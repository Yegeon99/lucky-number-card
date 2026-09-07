"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}) {
  const base =
    "flex h-[60px] w-full items-center justify-center rounded-[14px] text-[17px] font-semibold tracking-tight transition-[transform,background-color,opacity] active:scale-[0.985] " +
    (disabled
      ? "bg-paper-2 text-ink-3 cursor-not-allowed"
      : "bg-accent text-white shadow-[0_16px_34px_-14px_rgba(196,22,28,0.7)]");
  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${className}`} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`${base} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const base =
    "flex h-[52px] w-full items-center justify-center rounded-[14px] border border-ink/20 bg-transparent text-[16px] font-medium text-ink transition-[transform,background-color] active:scale-[0.985] active:bg-paper-2";
  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`${base} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] z-50 flex justify-center px-6"
        >
          <div className="rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper shadow-soft backdrop-blur">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="닫기"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-[28px] border-t border-line bg-paper-2 px-6 pt-3 safe-bottom shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TopBar({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-line bg-paper/92 px-2 backdrop-blur">
      <div className="flex w-16 items-center">
        {back && (
          <Link href={back} aria-label="뒤로" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-paper-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
      </div>
      <h1 className="text-[16px] font-semibold tracking-tight">{title}</h1>
      <div className="flex w-16 items-center justify-end pr-2">{right}</div>
    </header>
  );
}

export function SampleLabel({ className = "" }: { className?: string }) {
  return (
    <span className={`rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur ${className}`}>
      샘플 이미지, 실제 상품과 무관
    </span>
  );
}
