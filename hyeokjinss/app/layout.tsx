import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ScrollRuntimeProvider } from "@/hooks/useScrollRuntime";
import { SectionRegistryProvider } from "@/hooks/useSectionRegistry";
import { ScrollIndicatorsProvider } from "@/hooks/useScrollIndicators";
import { ScrollProgress } from "@/components/common/ScrollProgress";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hyeokjin | Frontend Portfolio",
  description: "Scroll-first frontend portfolio built with Next.js.",
  openGraph: {
    title: "Hyeokjin | Frontend Portfolio",
    description: "Scroll-first frontend portfolio built with Next.js.",
    images: ["/public/example.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-neutral-950 font-sans text-white antialiased`}>
        <ScrollRuntimeProvider>
          <SectionRegistryProvider>
            <ScrollIndicatorsProvider>
              <ScrollProgress />
              {children}
            </ScrollIndicatorsProvider>
          </SectionRegistryProvider>
        </ScrollRuntimeProvider>
      </body>
    </html>
  );
}
