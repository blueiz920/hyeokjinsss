import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ScrollRuntimeProvider } from "@/hooks/useScrollRuntime";
import { SectionRegistryProvider } from "@/hooks/useSectionRegistry";
import { ScrollIndicatorsProvider } from "@/hooks/useScrollIndicators";
import { PointerGlow } from "@/components/common/PointerGlow";
import { ScrollProgress } from "@/components/common/ScrollProgress";
import { siteConfig } from "@/data/site";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [siteConfig.ogImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
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
