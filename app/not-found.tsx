import Link from "next/link";

/** 없는 주소. 카드 홈 톤을 유지하고 첫 화면으로 돌려보낸다. */
export default function NotFound() {
  return (
    <div className="phone flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center safe-bottom">
        <p className="font-wide text-[64px] leading-none text-ink-3">404</p>
        <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">찾을 수 없는 화면입니다</h1>
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-3">
          주소가 바뀌었거나 잘못 입력되었어요. 카드를 폰에 다시 대거나 첫 화면으로 돌아가 주세요.
        </p>
        <Link
          href="/"
          className="mt-8 flex h-[52px] w-full max-w-[280px] items-center justify-center rounded-[14px] border border-ink/20 text-[16px] font-medium text-ink active:bg-paper-2"
        >
          첫 화면으로
        </Link>
      </main>
    </div>
  );
}
