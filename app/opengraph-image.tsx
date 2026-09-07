import { ImageResponse } from "next/og";

/**
 * 링크 미리보기(카카오톡, 문자, SNS). 빌드 시점에 만들어지므로 외부 서체 없이 영문만 쓴다.
 * 한국어 제목과 설명은 메타 태그(title, description)로 함께 나간다.
 */
export const alt = "럭키 넘버 카드";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0f0e0e 0%, #1a1918 55%, #3a0d10 100%)",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(160deg, #d51b21 0%, #8f0f14 100%)",
              borderRadius: 16,
              color: "#fff",
              fontSize: 44,
              fontWeight: 900,
            }}
          >
            N
          </div>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#c9c4ba" }}>LUCKY NUMBER CARD</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 168, fontWeight: 900, letterSpacing: -6, lineHeight: 0.95 }}>CHOOM</div>
          <div style={{ fontSize: 34, color: "#c9c4ba", letterSpacing: 2 }}>BABYMONSTER 3RD MINI ALBUM · PHOTOCARD</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 26px",
              borderRadius: 999,
              background: "#14301f",
              color: "#7fd6a2",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            VERIFIED · No. 0320 / 1000
          </div>
          <div style={{ fontSize: 24, color: "#8b867c" }}>Tap your card. No app, no login.</div>
        </div>
      </div>
    ),
    size,
  );
}
