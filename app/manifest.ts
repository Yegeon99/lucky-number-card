import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "럭키 넘버 카드",
    short_name: "럭키 넘버",
    description: "포토카드의 멤버와 함께 프레임 사진을 찍고 행운의 번호를 노려보세요!",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0e0e",
    theme_color: "#0f0e0e",
    lang: "ko",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
