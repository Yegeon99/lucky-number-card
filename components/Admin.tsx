"use client";

import { useCallback, useEffect, useState } from "react";
import { BottomSheet, PrimaryButton, SecondaryButton, Toast, TopBar } from "./ui";

type Row = {
  id: string;
  designId: string;
  member: string;
  serial: string;
  serialNote: string | null;
  meaning: string | null;
  issued: number;
  status: "unregistered" | "registered" | "lucky";
  isLuckyCard: boolean;
  viewCount: number;
  registeredAt: string | null;
  lastViewedAt: string | null;
  tagToken: string;
};

type QrInfo = { label: string; url: string; file: string };

const KEY = "lnc.adminKey";

export function Admin() {
  const [key, setKey] = useState("");
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [luckyHash, setLuckyHash] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [lastQr, setLastQr] = useState<QrInfo[] | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved) setKey(saved);
    } catch {
      // 무시
    }
    setOrigin(window.location.origin);
  }, []);

  const applyRows = useCallback((next: Row[]) => {
    setRows(next);
    setDrafts(Object.fromEntries(next.map((r) => [r.designId, r.serial])));
  }, []);

  const load = useCallback(
    async (k: string) => {
      setError(null);
      const res = await fetch("/api/admin", { headers: { "x-admin-key": k }, cache: "no-store" });
      if (res.status === 401) {
        setError("비밀번호가 맞지 않아요");
        setRows(null);
        return false;
      }
      const data = (await res.json()) as { rows: Row[]; luckyHash: string };
      applyRows(data.rows);
      setLuckyHash(data.luckyHash);
      return true;
    },
    [applyRows],
  );

  useEffect(() => {
    if (key) void load(key);
  }, [key, load]);

  const login = async () => {
    const ok = await load(input);
    if (ok) {
      setKey(input);
      try {
        window.sessionStorage.setItem(KEY, input);
      } catch {
        // 무시
      }
    }
  };

  const reset = async () => {
    const res = await fetch("/api/admin", { method: "POST", headers: { "x-admin-key": key } });
    setConfirm(false);
    if (res.ok) {
      showToast("등록 상태를 모두 해제했어요");
      await load(key);
    }
  };

  const saveSerial = async (row: Row) => {
    const serial = (drafts[row.designId] ?? "").trim();
    if (serial === row.serial) return;
    if (!/^\d{4}$/.test(serial)) {
      showToast("번호는 숫자 4자리여야 해요");
      return;
    }
    setSaving(row.designId);
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ designId: row.designId, serial }),
    });
    setSaving(null);
    const data = (await res.json()) as { ok?: boolean; error?: string; rows?: Row[]; qr?: QrInfo[]; luckyHash?: string };
    if (!res.ok || !data.ok) {
      showToast(data.error ?? "수정에 실패했어요");
      return;
    }
    if (data.rows) applyRows(data.rows);
    if (data.luckyHash) setLuckyHash(data.luckyHash);
    if (data.qr) setLastQr(data.qr);
    showToast(`${row.member} 번호를 ${serial}로 바꿨어요. 주소와 QR도 갱신됐어요`);
  };

  const fmt = (iso: string | null) => {
    if (!iso) return "·";
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  if (!key || !rows) {
    return (
      <div className="phone flex flex-col">
        <TopBar title="관리" back="/" />
        <main className="flex flex-1 flex-col px-6 pt-10">
          <h2 className="text-[22px] font-bold tracking-tight">관리자 확인</h2>
          <p className="mt-2 text-[14px] text-ink-2">카드 발행 목록과 등록 상태를 확인하는 화면입니다.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void login()}
            placeholder="비밀번호"
            className="mt-6 h-[52px] rounded-2xl border border-line bg-paper-2 px-4 text-[16px] text-ink outline-none focus:border-ink"
            autoFocus
          />
          {error && <p className="mt-2 text-[13px] text-bad">{error}</p>}
          <div className="mt-4">
            <PrimaryButton onClick={() => void login()}>들어가기</PrimaryButton>
          </div>
        </main>
      </div>
    );
  }

  const registered = rows.filter((r) => r.status !== "unregistered").length;
  const needsCheck = rows.filter((r) => r.serialNote).length;

  return (
    <div className="phone flex flex-col">
      <TopBar
        title="관리"
        back="/"
        right={
          <button type="button" className="text-[13px] text-bad" onClick={() => setConfirm(true)}>
            초기화
          </button>
        }
      />
      <main className="flex-1 px-4 pb-12 pt-5">
        <div className="flex items-end justify-between px-1">
          <p className="text-[13px] text-ink-3">발행 카드 {rows.length}장</p>
          <p className="tnum text-[13px] text-ink-2">등록 {registered} · 미등록 {rows.length - registered}</p>
        </div>

        {/* 카드 번호 (생일) 확인과 수정 */}
        <section className="mt-4 rounded-2xl border border-line bg-paper-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">카드 번호 (멤버 생일)</h2>
            {needsCheck > 0 && <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn">확인 필요 {needsCheck}건</span>}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
            번호를 바꾸면 카드 주소와 데모 QR(outputs 폴더)이 함께 갱신됩니다. 럭키 목록에 있는 번호를 바꾸면 안내 페이지의 해시값도 다시 계산됩니다.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {rows.map((r) => {
              const draft = drafts[r.designId] ?? r.serial;
              const dirty = draft !== r.serial;
              return (
                <li key={r.designId} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 shrink-0 text-[14px] font-semibold">{r.member}</span>
                  <input
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.designId]: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    onKeyDown={(e) => e.key === "Enter" && void saveSerial(r)}
                    className={`tnum h-9 w-[76px] rounded-lg border bg-paper px-2.5 text-center text-[15px] font-semibold text-ink outline-none focus:border-ink ${
                      r.serialNote ? "border-warn/60" : "border-line"
                    }`}
                    aria-label={`${r.member} 카드 번호`}
                  />
                  <span className="flex-1 truncate text-[11.5px] text-ink-3">
                    {r.serialNote ? <span className="font-semibold text-warn">{r.serialNote}</span> : r.isLuckyCard ? "럭키 목록 포함" : ""}
                  </span>
                  <button
                    type="button"
                    disabled={!dirty || saving === r.designId}
                    onClick={() => void saveSerial(r)}
                    className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                      dirty ? "bg-ink text-paper" : "bg-paper-3 text-ink-3"
                    }`}
                  >
                    {saving === r.designId ? "저장 중" : "저장"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {lastQr && (
          <section className="mt-3 rounded-2xl border border-line bg-paper-2 p-4 text-[12px] leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">QR 다시 만들었어요</p>
            {lastQr.map((q) => (
              <p key={q.file} className="mt-1 break-all">
                {q.label}: <span className="text-ink-3">{q.url}</span>
              </p>
            ))}
          </section>
        )}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="bg-paper-2 text-[12px] text-ink-3">
              <tr>
                <th className="px-3 py-2.5 font-medium">번호</th>
                <th className="px-3 py-2.5 font-medium">멤버</th>
                <th className="px-3 py-2.5 font-medium">상태</th>
                <th className="px-3 py-2.5 text-right font-medium">확인</th>
                <th className="px-3 py-2.5 font-medium">등록</th>
                <th className="px-3 py-2.5 font-medium">마지막 확인</th>
                <th className="px-3 py-2.5 font-medium">주소</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="tnum px-3 py-2.5 font-semibold">{r.serial}</td>
                  <td className="px-3 py-2.5">{r.member}</td>
                  <td className="px-3 py-2.5">
                    <StatusChip status={r.status} isLuckyCard={r.isLuckyCard} />
                  </td>
                  <td className="tnum px-3 py-2.5 text-right">{r.viewCount}</td>
                  <td className="tnum px-3 py-2.5 text-ink-2">{fmt(r.registeredAt)}</td>
                  <td className="tnum px-3 py-2.5 text-ink-2">{fmt(r.lastViewedAt)}</td>
                  <td className="px-3 py-2.5">
                    <a className="text-ink-3 underline underline-offset-2" href={`/c/${r.id}?t=${r.tagToken}`} target="_blank" rel="noreferrer">
                      열기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 px-1 text-[12px] leading-relaxed text-ink-3">
          NFC 카드에 기록할 주소 형식: {origin}/c/[카드식별자]?t=[토큰]. 초기화하면 모든 카드의 첫 등록이 다시 열립니다. 도감은 각 폰 안에 있으므로 여기서 지워지지 않습니다.
        </p>
        <p className="mt-2 break-all px-1 font-mono text-[11px] text-ink-3">럭키 목록 해시 {luckyHash}</p>
      </main>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)}>
        <h2 className="text-[20px] font-bold tracking-tight">데모 초기화</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          모든 카드의 등록 상태와 확인 횟수를 지웁니다. 카드를 다시 대면 첫 등록 화면이 다시 나옵니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setConfirm(false)}>취소</SecondaryButton>
          <PrimaryButton className="h-[52px]" onClick={() => void reset()}>
            초기화
          </PrimaryButton>
        </div>
      </BottomSheet>
      <Toast message={toast} />
    </div>
  );
}

function StatusChip({ status, isLuckyCard }: { status: Row["status"]; isLuckyCard: boolean }) {
  if (status === "lucky") {
    return <span className="badge-gold rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-[0.08em]">럭키 등록</span>;
  }
  if (status === "registered") {
    return <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok">등록</span>;
  }
  return (
    <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-ink-3">
      미등록{isLuckyCard ? " (럭키)" : ""}
    </span>
  );
}
