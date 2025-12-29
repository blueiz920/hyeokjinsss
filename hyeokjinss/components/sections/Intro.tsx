"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { initIntroAnimation } from "@/lib/animation/intro";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";

export const Intro = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    register("intro", sectionRef);

    return () => {
      unregister("intro");
    };
  }, [register, unregister]);

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    let cleanup: (() => void) | undefined;

    initIntroAnimation(sectionRef.current, prefersReducedMotion).then((destroy) => {
      cleanup = destroy;
    });

    return () => {
      cleanup?.();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="intro"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding flex min-h-[90vh] items-center bg-neutral-950 text-white"
      aria-labelledby="intro-title"
    >
      <Container className="space-y-8">
        <p
          className="text-xs uppercase tracking-[0.4em] text-white/60"
          data-intro-item
        >
          {portfolio.introEyebrow}
        </p>
        <h1
          id="intro-title"
          className="text-4xl font-semibold leading-tight md:text-6xl"
          data-intro-item
        >
          {portfolio.introHeadline}
        </h1>
        <p
          className="max-w-2xl text-lg text-white/70 md:text-xl"
          data-intro-item
        >
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
