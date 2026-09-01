import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ScrollRuntimeProvider } from "@/hooks/useScrollRuntime";
import { SectionRegistryProvider } from "@/hooks/useSectionRegistry";
import { PointerGlow } from "@/components/common/PointerGlow";
import { MagneticLayer } from "@/components/common/MagneticLayer";
import { ScrollProgress } from "@/components/common/ScrollProgress";
import { RouteTransition } from "@/components/common/RouteTransition";
import { IntroLoaderGate } from "@/components/layout/IntroLoaderGate";
import { siteConfig } from "@/data/site";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.author.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "IfFsfKLBvllcItI_4GIp9tNalW6C9ZS-87uKZs9cxGU",
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
            <RouteTransition>
              <IntroLoaderGate />
              <PointerGlow />
              <MagneticLayer />
              <ScrollProgress />
              {children}
            </RouteTransition>
          </SectionRegistryProvider>
        </ScrollRuntimeProvider>
      </body>
    </html>
  );
}
