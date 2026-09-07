"use client";

/**
 * 공용 스위치. 아이폰 설정 스위치 기준.
 * 실제 체크박스 위에 그려서 키보드(Space)와 화면 낭독기로도 켜고 끌 수 있다.
 * 트랙 44×26, 손잡이 지름 22, 안쪽 여백 2. 이동 거리 44 - 22 - 4 = 18px.
 */
export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2.5">
      <span className="text-[12px] font-medium leading-none text-ink-2">{label}</span>
      <span className="relative inline-block h-[26px] w-[44px] shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        {/* 트랙 */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-paper-3 transition-colors duration-200 ease-out peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ink/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper"
        />
        {/* 손잡이: 항상 트랙 위, 트랙 안쪽에서만 움직인다 */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[2px] top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-out peer-checked:translate-x-[18px]"
        />
      </span>
    </label>
  );
}
