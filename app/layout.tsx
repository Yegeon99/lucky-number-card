import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const DESCRIPTION = "포토카드의 멤버와 함께 프레임 사진을 찍고 행운의 번호를 노려보세요!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "럭키 넘버 카드",
    template: "%s · 럭키 넘버 카드",
  },
  description: DESCRIPTION,
  applicationName: "럭키 넘버 카드",
  appleWebApp: {
    capable: true,
    title: "럭키 넘버 카드",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "럭키 넘버 카드",
    title: "럭키 넘버 카드",
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "럭키 넘버 카드",
    description: DESCRIPTION,
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0e0e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={archivo.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
