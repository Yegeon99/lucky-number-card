"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hasLuckyCard, isSetComplete, useCollection } from "@/lib/collection";
import { availableFrames, randomSide, type FrameDef, type Side } from "@/lib/frames";
import { PHOTO_ASPECT, canvasToBlob, composeSingle, todayText, toWallpaper, type Shot } from "@/lib/compose";
import { loadSessionCard } from "@/lib/session-card";
import { cardHref } from "@/lib/card-link";
import { parseCardId } from "@/lib/admin-mode";
import type { PublicSet } from "@/lib/public-set";
import { PrimaryButton, SecondaryButton, Toast, TopBar } from "./ui";

type Step = "intro" | "capture" | "compose" | "result";

type CurrentCard = { id: string | null; tagToken: string | null; designId: string; serial: string; member: string; accent: string };

/**
 * 스튜디오: 내 사진 한 장 + 멤버 누끼가 옆에 서는 프레임.
 * 사진은 메모리에만 두고 어떤 요청에도 담지 않는다.
 */
export function Studio({ set }: { set: PublicSet }) {
  const params = useSearchParams();
  const cardParam = params.get("card");
  const items = useCollection((s) => s.items);
  const hydrate = useCollection((s) => s.hydrate);
  const hydrated = useCollection((s) => s.hydrated);

  const [step, setStep] = useState<Step>("intro");
  const [shot, setShot] = useState<Shot | null>(null);
  const [side, setSide] = useState<Side>("left");
  const [frameId, setFrameId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [luckyFromSession, setLuckyFromSession] = useState(false);
  const [current, setCurrent] = useState<CurrentCard | null>(null);

  useEffect(() => {
    hydrate();
    // 멤버가 설 쪽은 들어올 때마다 무작위
    setSide(randomSide());
  }, [hydrate]);

  // 현재 카드 결정: 카드 홈에서 넘어온 정보 > 도감 > 세트 첫 디자인
  useEffect(() => {
    if (!hydrated) return;
    const session = loadSessionCard();
    if (session && (!cardParam || session.card.id === cardParam)) {
      setCurrent({
        id: session.card.id,
        tagToken: session.tagToken,
        designId: session.card.designId,
        serial: session.card.serial,
        member: session.card.member,
        accent: session.card.accent,
      });
      setLuckyFromSession(session.luckyUnlocked);
      return;
    }
    const fromCollection = cardParam ? items.find((c) => c.cardId === cardParam) : items[items.length - 1];
    if (fromCollection) {
      setCurrent({
        id: fromCollection.cardId,
        tagToken: fromCollection.tagToken ?? null,
        designId: fromCollection.designId,
        serial: fromCollection.serial,
        member: fromCollection.member,
        accent: fromCollection.accent,
      });
      return;
    }
    // 카드 확인 없이 들어온 경우(관리자 모드): 카드 식별자에서 디자인과 번호를 읽는다.
    const parsed = cardParam ? parseCardId(cardParam, set.designs.map((x) => x.id)) : null;
    const fromId = parsed ? set.designs.find((x) => x.id === parsed.designId) : null;
    if (parsed && fromId) {
      setCurrent({ id: cardParam, tagToken: null, designId: fromId.id, serial: parsed.serial, member: fromId.member, accent: fromId.accent });
      return;
    }
    const d = set.designs[0];
    setCurrent({ id: null, tagToken: null, designId: d.id, serial: "0000", member: d.member, accent: d.accent });
  }, [hydrated, cardParam, items, set.designs]);

  const frames = useMemo(() => {
    return availableFrames({
      designs: set.designs,
      artist: set.artist,
      currentDesignId: current?.designId ?? null,
      luckyUnlocked: luckyFromSession || hasLuckyCard(items),
      groupUnlocked: isSetComplete(items, set.id, set.designs.map((d) => d.id)),
    });
  }, [set, current, luckyFromSession, items]);

  const frame: FrameDef = frames.find((f) => f.id === frameId) ?? frames[0];

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const onFile = async (files: FileList) => {
    const loaded = await loadFile(files[0]);
    if (!loaded) {
      showToast("사진을 불러오지 못했어요");
      return;
    }
    setShot(loaded);
    setStep("compose");
  };

  return (
    <div className="phone flex min-h-[100dvh] flex-col">
      <TopBar
        title="함께 찍기"
        back={cardHref(current?.id, current?.tagToken) ?? "/collection"}
        right={
          step !== "intro" ? (
            <button type="button" className="text-[13px] text-ink-3" onClick={() => setStep("intro")}>
              처음으로
            </button>
          ) : null
        }
      />

      {step === "intro" && current && <Intro frame={frame} side={side} current={current} onCamera={() => setStep("capture")} onFile={onFile} />}

      {step === "capture" && (
        <Capture
          onShot={(s) => {
            setShot(s);
            setStep("compose");
          }}
          onFile={onFile}
        />
      )}

      {step === "compose" && current && (
        <Compose
          shot={shot}
          frames={frames}
          frame={frame}
          setFrameId={setFrameId}
          side={side}
          setSide={setSide}
          current={current}
          onRetake={() => setStep("capture")}
          onFile={onFile}
          onDone={() => setStep("result")}
        />
      )}

      {step === "result" && current && (
        <Result shot={shot} frame={frame} side={side} current={current} onBack={() => setStep("compose")} showToast={showToast} />
      )}

      {step !== "intro" && step !== "result" && <p className="pb-4 text-center text-[11.5px] text-ink-3">사진은 내 폰에만 있어요</p>}

      <Toast message={toast} />
    </div>
  );
}

/* 미리보기 이미지를 만드는 공용 훅 */
function usePreview(shot: Shot | null, frame: FrameDef, side: Side, current: CurrentCard, wallpaper = false) {
  const [url, setUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    (async () => {
      let c = await composeSingle(shot, frame, side, { serial: current.serial, member: current.member, dateText: todayText() });
      if (wallpaper) c = toWallpaper(c, frame.style === "dark" ? "#0b0b0b" : "#d3dee6");
      const blob = await canvasToBlob(c, "image/jpeg", 0.9);
      if (!alive) return;
      blobRef.current = blob;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [shot, frame, side, current, wallpaper]);
  return { url, blobRef };
}

/* 1. 시작: 템플릿 미리보기 + 권한 요청 전 안내 */
function Intro({
  frame,
  side,
  current,
  onCamera,
  onFile,
}: {
  frame: FrameDef;
  side: Side;
  current: CurrentCard;
  onCamera: () => void;
  onFile: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { url } = usePreview(null, frame, side, current);
  return (
    <div className="flex flex-1 flex-col px-6 pt-5 safe-bottom">
      <div className="flex flex-1 flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative aspect-[3/4] w-[62%] max-w-[240px] overflow-hidden rounded-xl bg-paper-2 shadow-card"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="프레임 미리보기" className="h-full w-full object-contain" />
          ) : (
            <div className="h-full w-full animate-pulse bg-paper-2" />
          )}
        </motion.div>
        <h2 className="mt-6 text-center text-[24px] font-bold tracking-tight">{current.member}와 함께 찍기</h2>
        <p className="mx-auto mt-2 max-w-[290px] text-center text-[14.5px] leading-relaxed text-ink-2">
          내 사진 한 장 옆에 {current.member}가 서요. 사진은 내 폰에만 저장돼요. 카메라 사용을 허용해 주세요
        </p>
      </div>
      <div className="flex flex-col gap-3 pt-6">
        <PrimaryButton onClick={onCamera}>셀카 찍기</PrimaryButton>
        <SecondaryButton onClick={() => inputRef.current?.click()}>갤러리에서 한 장 선택</SecondaryButton>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onFile(e.target.files)} />
      </div>
    </div>
  );
}

/** 영상 안에서 합성 사진 영역 비율(PHOTO_ASPECT)로 가운데 최대 크기 상자 */
function cropBox(vw: number, vh: number): { w: number; h: number } {
  let w = vw;
  let h = Math.round(vw / PHOTO_ASPECT);
  if (h > vh) {
    h = vh;
    w = Math.round(vh * PHOTO_ASPECT);
  }
  return { w, h };
}

/**
 * 폰 카메라가 디지털 줌이 걸린 채로 열리면 1배로 되돌린다.
 * 초광각(1배 미만)은 왜곡이 커서 쓰지 않는다. 지원 안 하는 기기·전면 카메라는 조용히 넘어간다.
 */
async function widenTrack(track: MediaStreamTrack | undefined) {
  if (!track) return;
  try {
    const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
    const cur = (track.getSettings() as MediaTrackSettings & { zoom?: number }).zoom;
    if (!caps.zoom || cur === undefined) return;
    const target = Math.max(caps.zoom.min, 1);
    if (cur > target) await track.applyConstraints({ advanced: [{ zoom: target } as MediaTrackConstraintSet] });
  } catch {
    // 줌 조절 실패는 무시
  }
}

/* 2. 촬영: 3초 카운트다운 후 한 장 */
function Capture({ onShot, onFile }: { onShot: (s: Shot) => void; onFile: (files: FileList) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [permission, setPermission] = useState<"asking" | "granted" | "denied">("asking");
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [running, setRunning] = useState(false);
  // 스트림 가로/세로 비율(회전 반영). 미리보기 상자가 이 비율을 따라 화각 전체를 보여준다.
  const [streamAspect, setStreamAspect] = useState(3 / 4);
  const inputRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      stop();
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermission("denied");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // 폰 기준: 4:3 센서 모드를 우선 요청한다. 16:9 모드는 세로로 길어 정사각 사진 영역에서 위아래가 크게 잘린다.
          video: { facingMode: facing, aspectRatio: { ideal: 4 / 3 }, width: { ideal: 1440 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        await widenTrack(stream.getVideoTracks()[0]);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setPermission("granted");
      } catch {
        if (!cancelled) setPermission("denied");
      }
    }
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, stop]);

  const takeOne = useCallback((): Shot | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    // 합성 사진 영역과 같은 비율로 가운데를 자른다. 미리보기 가이드와 결과가 일치한다.
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const { w, h } = cropBox(vw, vh);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const sx = (vw - w) / 2;
    const sy = (vh - h) / 2;
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, w, h, 0, 0, w, h);
    return c;
  }, [facing]);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    for (let n = 3; n >= 1; n--) {
      setCount(n);
      await wait(1000);
    }
    setCount(null);
    const s = takeOne();
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setRunning(false);
    if (s) onShot(s);
  }, [running, takeOne, onShot]);

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="relative mx-auto mt-3 max-w-[calc(100%-32px)] overflow-hidden rounded-3xl bg-black ring-1 ring-line"
        style={{ aspectRatio: String(streamAspect), height: `min(58dvh, calc((100vw - 32px) / ${streamAspect}))` }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-contain"
          style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth > 0 && v.videoHeight > 0) setStreamAspect(v.videoWidth / v.videoHeight);
          }}
        />
        {/* 사진에 들어가는 범위. 바깥은 어둡게 */}
        {permission === "granted" && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[6px] ring-1 ring-white/70 shadow-[0_0_0_200vmax_rgba(0,0,0,0.55)]"
            style={
              streamAspect >= PHOTO_ASPECT
                ? { height: "100%", aspectRatio: String(PHOTO_ASPECT) }
                : { width: "100%", aspectRatio: String(PHOTO_ASPECT) }
            }
          />
        )}
        <AnimatePresence>
          {count !== null && (
            <motion.div
              key={count}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="font-wide pointer-events-none absolute inset-0 flex items-center justify-center text-[120px] text-white drop-shadow-lg"
            >
              {count}
            </motion.div>
          )}
        </AnimatePresence>
        {flash && <div className="pointer-events-none absolute inset-0 bg-white" />}

        {permission === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0b0b0a] px-8 text-center text-ink">
            <p className="text-[16px] font-semibold">카메라를 사용할 수 없어요</p>
            <p className="text-[13px] leading-relaxed text-ink-2">갤러리에서 사진을 골라도 완성할 수 있어요. 사진은 내 폰에만 있어요.</p>
            <button type="button" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper" onClick={() => inputRef.current?.click()}>
              갤러리에서 고르기
            </button>
          </div>
        )}
        {permission === "asking" && <div className="absolute inset-0 flex items-center justify-center text-[13px] text-ink-3">카메라를 준비하고 있어요</div>}

        {permission === "granted" && (
          <button
            type="button"
            aria-label="전후 카메라 전환"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8M20 4v4h-4" />
              <path d="M20 12a8 8 0 0 1-13.6 5.7L4 16M4 20v-4h4" />
            </svg>
          </button>
        )}
      </div>

      {permission === "granted" && (
        <p className="mt-2 text-center text-[12.5px] text-ink-3">밝은 네모 안이 사진에 들어가요. 얼굴이 크면 폰을 조금 멀리 두세요</p>
      )}

      <div className="mt-auto flex flex-col gap-3 px-4 pt-5 pb-2">
        <PrimaryButton onClick={run} disabled={permission !== "granted" || running}>
          {running ? "찍는 중" : "3초 뒤 촬영"}
        </PrimaryButton>
        <button type="button" className="text-center text-[13px] text-ink-3" onClick={() => inputRef.current?.click()}>
          갤러리에서 불러오기
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onFile(e.target.files)} />
      </div>
    </div>
  );
}

/* 3. 프레임과 위치 고르기 + 미리보기 */
function Compose({
  shot,
  frames,
  frame,
  setFrameId,
  side,
  setSide,
  current,
  onRetake,
  onFile,
  onDone,
}: {
  shot: Shot | null;
  frames: FrameDef[];
  frame: FrameDef;
  setFrameId: (id: string) => void;
  side: Side;
  setSide: (s: Side) => void;
  current: CurrentCard;
  onRetake: () => void;
  onFile: (files: FileList) => void;
  onDone: () => void;
}) {
  const { url } = usePreview(shot, frame, side, current);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-6 pt-4">
        {/* 폭 우선으로 키우고, 키 작은 화면에서는 높이로 제한한다 */}
        <div className="relative overflow-hidden rounded-xl bg-paper-2 shadow-card" style={{ width: "min(100%, calc(56dvh * 0.75))", aspectRatio: "3 / 4" }}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="미리보기" className="h-full w-full object-contain" />
          ) : (
            <div className="h-full w-full animate-pulse bg-paper-2" />
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink-2">{current.member} 위치</span>
          <div className="flex rounded-full bg-paper-2 p-1 text-[13px] font-medium">
            {(["left", "right"] as Side[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                aria-pressed={side === s}
                className={`rounded-full px-3.5 py-1.5 transition-colors ${side === s ? "bg-ink text-paper" : "text-ink-2"}`}
              >
                {s === "left" ? "왼쪽" : "오른쪽"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink-2">프레임</span>
          <span className="text-[12px] text-ink-3">{frames.length}종 사용 가능</span>
        </div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {frames.map((f) => {
            const active = f.id === frame.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrameId(f.id)}
                aria-pressed={active}
                aria-label={`${f.name} 선택`}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors ${active ? "border-ink bg-ink text-paper" : "border-line bg-paper-2"}`}
              >
                <FrameSwatch frame={f} />
                <span>
                  <span className="block text-[13px] font-semibold">{f.name}</span>
                  <span className={`block text-[11px] ${active ? "text-paper/70" : "text-ink-3"}`}>
                    {f.kind === "card" ? "카드 기본" : f.kind === "lucky" ? "럭키 넘버 해금" : "세트 완성 해금"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-5 pb-2">
        <PrimaryButton onClick={onDone}>완성하기</PrimaryButton>
        <div className="flex items-center justify-center gap-5 text-[13px] text-ink-3">
          <button type="button" onClick={onRetake}>
            다시 찍기
          </button>
          <span className="h-3 w-px bg-line" />
          <button type="button" onClick={() => inputRef.current?.click()}>
            다른 사진 고르기
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onFile(e.target.files)} />
      </div>
    </div>
  );
}

function FrameSwatch({ frame }: { frame: FrameDef }) {
  const bg =
    frame.style === "gold"
      ? "linear-gradient(135deg,#f7e6b0,#a87f25,#fbedc2)"
      : frame.style === "dark"
        ? "#111"
        : "repeating-linear-gradient(to bottom, #dce7ee 0 6px, rgba(59,67,76,0.55) 6px 7px)";
  return (
    <span className="relative flex h-9 w-7 items-end justify-center overflow-hidden rounded-[4px] ring-1 ring-black/20" style={{ background: bg }}>
      <span className="block h-1.5 w-full" style={{ background: frame.style === "gold" ? "#a87f25" : frame.accent }} />
    </span>
  );
}

/* 4. 결과 */
function Result({
  shot,
  frame,
  side,
  current,
  onBack,
  showToast,
}: {
  shot: Shot | null;
  frame: FrameDef;
  side: Side;
  current: CurrentCard;
  onBack: () => void;
  showToast: (m: string) => void;
}) {
  const [mode, setMode] = useState<"original" | "wallpaper">("original");
  const { url, blobRef } = usePreview(shot, frame, side, current, mode === "wallpaper");
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const fileName = `choom_${current.serial}_${todayText().replace(/\./g, "")}${mode === "wallpaper" ? "_wall" : ""}.jpg`;

  const shareFile = async (): Promise<boolean> => {
    const blob = blobRef.current;
    if (!blob) return false;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return true;
      }
    } catch {
      // 사용자가 공유 시트를 닫은 경우도 여기로 온다. 조용히 넘긴다.
      return true;
    }
    return false;
  };

  const save = async () => {
    if (!url) return;
    if (isIOS) {
      // 아이폰 사파리는 내려받기 대신 공유 시트의 "이미지 저장"이 가장 자연스럽다.
      const shared = await shareFile();
      if (!shared) showToast("이미지를 길게 눌러 저장하세요");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("저장했어요");
  };

  const share = async () => {
    const shared = await shareFile();
    if (!shared) showToast(isIOS ? "이미지를 길게 눌러 저장하세요" : "이 브라우저에서는 저장 버튼을 이용해 주세요");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-6 pt-4">
        <div
          className="relative overflow-hidden rounded-xl shadow-card"
          style={
            mode === "wallpaper"
              ? { width: "min(72%, calc(64dvh * 9 / 19.5))", aspectRatio: "9 / 19.5" }
              : { width: "min(100%, calc(64dvh * 0.75))", aspectRatio: "3 / 4" }
          }
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="완성 사진" className="h-full w-full object-contain" />
          ) : (
            <div className="h-full w-full animate-pulse bg-paper-2" />
          )}
        </div>
      </div>

      {isIOS && <p className="mt-3 text-center text-[13px] font-medium text-ink-2">저장을 누르고 &quot;이미지 저장&quot;을 고르거나, 이미지를 길게 눌러 저장하세요</p>}

      <div className="mt-4 flex justify-center">
        <div className="flex rounded-full bg-paper-2 p-1 text-[13px] font-medium">
          <button type="button" onClick={() => setMode("original")} aria-pressed={mode === "original"} className={`rounded-full px-3.5 py-1.5 ${mode === "original" ? "bg-ink text-paper" : "text-ink-2"}`}>
            원본
          </button>
          <button type="button" onClick={() => setMode("wallpaper")} aria-pressed={mode === "wallpaper"} className={`rounded-full px-3.5 py-1.5 ${mode === "wallpaper" ? "bg-ink text-paper" : "text-ink-2"}`}>
            배경화면 맞춤
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-5 safe-bottom">
        <div className="grid grid-cols-2 gap-3">
          <PrimaryButton onClick={save}>저장</PrimaryButton>
          <SecondaryButton className="h-[60px]" onClick={canShare ? share : () => showToast(isIOS ? "이미지를 길게 눌러 저장하세요" : "저장 버튼으로 내려받아 주세요")}>
            공유
          </SecondaryButton>
        </div>
        <button type="button" className="text-center text-[13px] text-ink-3" onClick={onBack}>
          프레임 다시 고르기
        </button>
      </div>
    </div>
  );
}

/* 갤러리 파일 한 장을 메모리로만 불러온다. 서버 전송 없음. */
async function loadFile(file: File | undefined): Promise<Shot | null> {
  if (!file || !file.type.startsWith("image/")) return null;
  try {
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    }
  } catch {
    // 아래 대체 경로
  }
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = url;
  });
}
