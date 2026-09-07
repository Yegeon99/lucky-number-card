import { ImageResponse } from "next/og";

/** iOS 홈 화면 아이콘. 모서리는 iOS가 깎으므로 배경을 꽉 채운다. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(160deg, #d51b21 0%, #8f0f14 100%)",
            borderRadius: 26,
            color: "#fff",
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: -3,
          }}
        >
          N
        </div>
      </div>
    ),
    size,
  );
}
