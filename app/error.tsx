"use client";

import Link from "next/link";
import { useEffect } from "react";

/** 화면 오류. 사진이나 개인정보는 어디에도 보내지 않고 다시 시도만 안내한다. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="phone flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center safe-bottom">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bad-soft text-bad">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
        </span>
        <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">잠시 문제가 생겼어요</h1>
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-3">
          화면을 다시 불러오면 대부분 해결돼요. 계속되면 카드를 폰에 다시 대 주세요.
        </p>
        <div className="mt-8 grid w-full max-w-[280px] grid-cols-2 gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex h-[52px] items-center justify-center rounded-[14px] bg-accent text-[16px] font-semibold text-white active:scale-[0.985]"
          >
            다시 시도
          </button>
          <Link href="/" className="flex h-[52px] items-center justify-center rounded-[14px] border border-ink/20 text-[16px] font-medium text-ink active:bg-paper-2">
            첫 화면으로
          </Link>
        </div>
        {error.digest && <p className="mt-6 font-mono text-[11px] text-ink-3">오류 코드 {error.digest}</p>}
      </main>
    </div>
  );
}
