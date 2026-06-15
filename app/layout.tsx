import "./globals.css";
import type { Metadata } from "next";
import { ScrollRuntimeProvider } from "@/hooks/useScrollRuntime";
import { SectionRegistryProvider } from "@/hooks/useSectionRegistry";
import { ScrollIndicatorsProvider } from "@/hooks/useScrollIndicators";
import { PointerGlow } from "@/components/common/PointerGlow";
import { ScrollProgress } from "@/components/common/ScrollProgress";

const siteUrl = "https://hyeokjinsss.vercel.app";
const siteTitle = "권혁진 | 프론트엔드 개발자";
const siteDescription =
  "문제를 파고들어 사용자 경험을 개선하고, 몰입감 있는 인터랙션을 설계하는 프론트엔드 개발자 권혁진의 포트폴리오입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "권혁진 포트폴리오",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/intro/intro-cinematic-poster.png",
        width: 1200,
        height: 675,
        alt: "권혁진 포트폴리오 대표 이미지",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-neutral-950 font-sans text-white antialiased">
        <ScrollRuntimeProvider>
          <SectionRegistryProvider>
            <ScrollIndicatorsProvider>
              <PointerGlow />
              <ScrollProgress />
              {children}
            </ScrollIndicatorsProvider>
          </SectionRegistryProvider>
        </ScrollRuntimeProvider>
      </body>
    </html>
  );
}
