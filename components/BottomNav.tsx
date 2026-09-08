"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 하단 고정 탭 바. 홈 · 내 도감 · 관리 세 탭.
 * 현재 경로와 맞는 탭만 강조한다. 럭키 안내는 탭에서 뺐다(/notice 페이지는 그대로 있음).
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t-2 border-accent bg-black/88 backdrop-blur-md">
      <div className="flex items-stretch px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        <Tab href="/" label="홈" icon={<HomeIcon />} active={pathname === "/"} />
        <Tab
          href="/collection"
          label="내 도감"
          icon={<BookIcon />}
          active={pathname.startsWith("/collection")}
        />
        <Tab
          href="/admin"
          label="관리"
          icon={<GearIcon />}
          active={pathname.startsWith("/admin")}
        />
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11.5px] font-medium active:bg-paper-2 ${
        active ? "text-white" : "text-ink-3"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10h13V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5V5.5M8 7h8M8 10.5h6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
