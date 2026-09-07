import Link from "next/link";
import { getCardSet, getLuckyConfig } from "@/lib/catalog";
import { luckyListHash } from "@/lib/lucky-hash";

export const dynamic = "force-dynamic";

/** 럭키 넘버 안내 (법적 고지). 사실만 나열한다. */
export default function NoticePage() {
  const cardSet = getCardSet();
  const luckyConfig = getLuckyConfig();
  const totalIssued = cardSet.issuedPerDesign * cardSet.designs.length;
  const luckyTotal = luckyConfig.numbers.length;
  const hash = luckyListHash();
  const ratio = ((luckyTotal / totalIssued) * 100).toFixed(3);
  const fmt = (d: string) => d.replace(/-/g, ".");

  return (
    <div className="phone flex flex-col">
      <header className="sticky top-0 z-30 flex h-[52px] items-center border-b border-line bg-paper/92 px-2 backdrop-blur">
        <Link href="/" aria-label="처음으로" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-paper-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="ml-1 text-[16px] font-semibold tracking-tight">럭키 넘버 안내</h1>
      </header>

      <main className="flex-1 px-6 pb-16 pt-7 text-[14.5px] leading-relaxed text-ink-2">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-3">{cardSet.artist} · {cardSet.album}</p>
        <h2 className="mt-1.5 text-[22px] font-bold tracking-tight text-ink">럭키 넘버 운영 고지</h2>
        <p className="mt-3">
          아래 내용은 이 카드 세트의 럭키 넘버 운영 사실을 그대로 적은 것입니다. 모든 카드는 완전한 포토카드이며 함께 찍기와 도감 기능을 동일하게 제공합니다. 럭키 넘버는 일부 번호에 덧붙는 플러스 혜택입니다.
        </p>

        <Section title="발행 정보">
          <Row k="총 발행 수량" v={<span className="tnum">{totalIssued.toLocaleString()}장</span>} />
          <Row k="구성" v={<span className="tnum">{cardSet.designs.length}종 × 각 {cardSet.issuedPerDesign.toLocaleString()}장</span>} />
          <Row k="발행일" v={fmt(cardSet.issuedAt)} />
          <Row k="제작" v={cardSet.manufacturer} />
        </Section>

        <Section title="럭키 넘버 수량과 등급">
          <Row k="럭키 넘버 수량" v={<span className="tnum">총 {luckyTotal}장 (전체 수량 대비 비율 {ratio}%)</span>} />
          {luckyConfig.grades.map((g) => (
            <Row key={g.grade} k={`${g.grade}등급`} v={<span><span className="tnum">{g.count}장</span> · {g.benefit}</span>} />
          ))}
        </Section>

        <Section title="사전 공개 해시값">
          <p className="text-[13.5px]">
            럭키 번호 목록은 발행 전에 확정되었으며, 목록의 SHA-256 해시값을 아래에 미리 공개합니다. 원본 목록은 공개 예정일에 공개하며, 같은 방식으로 다시 계산해 이 값과 대조할 수 있습니다.
          </p>
          <code className="mt-3 block break-all rounded-xl bg-paper-2 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-ink">{hash}</code>
          <p className="mt-2 text-[12px] text-ink-3">
            계산 방법: 각 번호를 &quot;디자인식별자:일련번호:등급&quot; 형식 한 줄로 적고 사전순으로 정렬한 뒤 줄바꿈으로 이어 붙인 문자열(UTF-8)의 SHA-256.
          </p>
          <Row k="해시 공개일" v={fmt(luckyConfig.publishedAt)} />
          <Row k="원본 공개 예정일" v={fmt(luckyConfig.revealAt)} />
        </Section>

        <Section title="응모와 문의">
          <Row k="응모 마감" v={fmt(luckyConfig.entryDeadline)} />
          <Row k="응모 자격" v="카드가 처음 등록된 기기에서 혜택 안내를 열어 응모한 사람" />
          <Row k="혜택 운영" v="기획사 (혜택 제공, 배송, 관련 세금 처리)" />
          <Row k="카드 제조" v={cardSet.manufacturer} />
          <Row k="인증과 번호 시스템" v="비글즈" />
          <Row k="문의처" v={<a className="underline underline-offset-4" href={`mailto:${luckyConfig.contact}`}>{luckyConfig.contact}</a>} />
        </Section>

        <p className="mt-10 text-[12px] leading-relaxed text-ink-3">
          이 화면의 이미지는 모두 샘플 이미지, 실제 상품과 무관합니다. 데모 버전에서는 표시된 수량과 날짜가 예시 값입니다.
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="text-[13px] font-semibold tracking-tight text-ink-3">{title}</h3>
      <div className="mt-2.5 rounded-2xl border border-line bg-paper px-4 py-1">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 border-b border-line py-3 last:border-b-0">
      <span className="text-[13px] text-ink-3">{k}</span>
      <span className="text-[14px] font-medium text-ink">{v}</span>
    </div>
  );
}
