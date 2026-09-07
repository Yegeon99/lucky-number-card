/** 화면 전환 중 뼈대. 상단 띠 자리와 카드 자리를 미리 잡아 빈 화면 깜빡임을 없앤다. */
export default function Loading() {
  return (
    <div className="phone flex flex-col" aria-busy="true" aria-label="불러오는 중">
      <div className="h-[52px] border-b border-line bg-paper-2/60" />
      <main className="flex flex-1 flex-col items-center px-6 pt-7">
        <div className="aspect-[55/85] w-[84%] max-w-[340px] animate-pulse rounded-card bg-paper-2" />
        <div className="mt-7 h-9 w-40 animate-pulse rounded-lg bg-paper-2" />
      </main>
    </div>
  );
}
