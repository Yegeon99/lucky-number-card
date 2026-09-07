"use client";

import { useEffect, useState } from "react";
import { cardFrame, groupFrame, luckyFrame, type FrameDef, type Side } from "@/lib/frames";
import { canvasToBlob, composeSingle, todayText } from "@/lib/compose";
import type { PublicSet } from "@/lib/public-set";
import { TopBar } from "./ui";

type Item = { key: string; title: string; frame: FrameDef; side: Side; serial: string; member: string };

/**
 * 멤버별 샘플 템플릿. 내 사진 자리는 비워 두고 멤버 누끼와 띠만 그린다.
 * 캡처와 검수를 위한 화면. 각 이미지에 data-template 속성이 붙는다.
 */
export function Templates({ set, serials }: { set: PublicSet; serials: Record<string, string> }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  const items: Item[] = [];
  set.designs.forEach((d, i) => {
    const side: Side = i % 2 === 0 ? "left" : "right";
    const serial = serials[d.id] ?? "0000";
    if (d.id === "group") {
      items.push({ key: "group", title: "단체 프레임", frame: groupFrame(set.artist, d), side, serial, member: d.member });
    } else {
      items.push({ key: d.id, title: `${d.member} 기본`, frame: cardFrame(d, set.artist), side, serial, member: d.member });
    }
  });
  const lucky = set.designs.find((d) => d.id === "chiquita") ?? set.designs[0];
  items.push({ key: "lucky", title: `럭키 금색 (${lucky.member})`, frame: luckyFrame(set.artist, lucky), side: "right", serial: serials[lucky.id] ?? "0000", member: lucky.member });

  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    (async () => {
      for (const it of items) {
        const c = await composeSingle(null, it.frame, it.side, { serial: it.serial, member: it.member, dateText: todayText() });
        const blob = await canvasToBlob(c, "image/png");
        if (!alive) return;
        const u = URL.createObjectURL(blob);
        made.push(u);
        setUrls((prev) => ({ ...prev, [it.key]: u }));
      }
    })();
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  return (
    <div className="phone flex flex-col">
      <TopBar title="샘플 템플릿" back="/" />
      <main className="px-5 pb-12 pt-5">
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          내 사진 자리를 비운 상태의 프레임입니다. 멤버는 왼쪽 또는 오른쪽에 서고, 실제 촬영 때는 들어올 때마다 무작위로 정해집니다.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
          {items.map((it) => (
            <li key={it.key} className="flex flex-col items-center">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-paper-2 shadow-card">
                {urls[it.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[it.key]} alt={it.title} data-template={it.key} className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-paper-2" />
                )}
              </div>
              <p className="mt-2 text-[13px] font-semibold">{it.title}</p>
              <p className="text-[11px] text-ink-3">{it.side === "left" ? "왼쪽" : "오른쪽"} · No. {it.serial}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
