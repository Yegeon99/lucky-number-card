import { ImageResponse } from "next/og";

/** 브라우저 탭과 홈 화면 아이콘. 검정 바탕에 앨범 레드 플레이트, 흰 N. */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0e0e",
          borderRadius: 112,
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(160deg, #d51b21 0%, #8f0f14 100%)",
            borderRadius: 72,
            color: "#fff",
            fontSize: 220,
            fontWeight: 900,
            letterSpacing: -8,
          }}
        >
          N
        </div>
      </div>
    ),
    size,
  );
}
