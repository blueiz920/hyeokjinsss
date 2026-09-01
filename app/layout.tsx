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
import { INTRO_SESSION_BOOTSTRAP } from "@/lib/animation/introSession";

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

// Next의 beforeInteractive는 런타임 큐를 거쳐 첫 페인트 뒤 실행될 수 있다.
// 세션 표식만큼은 파서 차단형 native head script로 body보다 먼저 처리한다.
// `suppressHydrationWarning`은 이 의도적인 루트 속성 차이에만 적용한다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={pretendard.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          id="intro-session-bootstrap"
          dangerouslySetInnerHTML={{ __html: INTRO_SESSION_BOOTSTRAP }}
        />
      </head>
      <body className="bg-neutral-950 font-sans text-white antialiased">
        <noscript>
          <style>{`
            .intro-loader { display: none !important; }
            html:has([data-intro-loader]),
            html:has([data-intro-loader]) body {
              overflow: auto !important;
              cursor: auto !important;
            }
            #intro [data-intro-item] { opacity: 1 !important; }
            #intro .intro-char { transform: none !important; }
            #intro .intro-pull-stage {
              clip-path: none !important;
              transform: none !important;
            }
          `}</style>
        </noscript>
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
