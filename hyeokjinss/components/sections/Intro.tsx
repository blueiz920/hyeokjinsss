"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { initIntroAnimation, initIntroScroll } from "@/lib/animation/intro";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";

export const Intro = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  useEffect(() => {
    if (!sectionRef.current) return;

    register("intro", sectionRef);
    return () => unregister("intro");
  }, [register, unregister]);

  // ✅ 진입 애니메이션
  useEffect(() => {
    if (!sectionRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initIntroAnimation(sectionRef.current!, prefersReducedMotion);
      if (!alive) {
        d();
        return;
      }
      destroy = d;
    })();

    return () => {
      alive = false;
      destroy?.();
    };
  }, [prefersReducedMotion]);

  // ✅ 스크롤 기반 흩어짐/소멸
  useEffect(() => {
    if (!sectionRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initIntroScroll({
        root: sectionRef.current!,
        heading: headingRef.current,
        bgLayer: bgRef.current,
        prefersReducedMotion,
      });

      if (!alive) {
        d();
        return;
      }
      destroy = d;
    })();

    return () => {
      alive = false;
      destroy?.();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="intro"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative flex min-h-[90vh] items-center overflow-hidden bg-neutral-950 text-white"
      aria-labelledby="intro-title"
    >
      <SectionBackground ref={bgRef} variant="intro" density={24} />

      <Container className="relative z-10 space-y-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60" data-intro-item>
          {portfolio.introEyebrow}
        </p>

        <h1
          id="intro-title"
          ref={headingRef}
          className="text-4xl font-semibold leading-tight md:text-6xl"
          data-intro-item
        >
          {portfolio.introHeadline}
        </h1>

        <p className="max-w-2xl text-lg text-white/70 md:text-xl" data-intro-item>
          {portfolio.introSubhead}
        </p>

        <div className="flex flex-wrap gap-3" data-intro-item>
          {portfolio.introHighlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
            >
              {item}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
};
