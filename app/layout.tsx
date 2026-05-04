import "./globals.css";
import type { Metadata } from "next";
import { ScrollRuntimeProvider } from "@/hooks/useScrollRuntime";
import { SectionRegistryProvider } from "@/hooks/useSectionRegistry";
import { ScrollIndicatorsProvider } from "@/hooks/useScrollIndicators";
import { PointerGlow } from "@/components/common/PointerGlow";
import { ScrollProgress } from "@/components/common/ScrollProgress";

export const metadata: Metadata = {
  metadataBase: new URL("https://hyeokjinsss.vercel.app"),
  title: "권혁진 | 웹 개발자 ",
  description: "호기심을 갖고 성장하는 개발s자 권혁진입니다.",
  openGraph: {
    title: "권혁진 | 성장하는 개발자",
    description: "개발자 권혁진의 공간입니다.",
    images: ["/hyeokjin.svg"],
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
