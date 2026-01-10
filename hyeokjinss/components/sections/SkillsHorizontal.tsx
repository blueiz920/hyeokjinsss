"use client";

import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { initSkillsHorizontal } from "@/lib/animation/skillsHorizontal";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

export const SkillsHorizontal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  // SSR/CSR 첫 렌더 동일
  const [bgDensity, setBgDensity] = useState(16);

  useEffect(() => {
  const id = requestAnimationFrame(() => {
    const { density } = getMotionProfile(prefersReducedMotion);
    const next = density + 10;

    setBgDensity((prev) => (prev === next ? prev : next));
  });

  return () => cancelAnimationFrame(id);
}, [prefersReducedMotion]);


  useEffect(() => {
    if (!sectionRef.current) return;
    register("skills", sectionRef);
    return () => unregister("skills");
  }, [register, unregister]);

  useEffect(() => {
    if (!sectionRef.current || !pinRef.current || !trackRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initSkillsHorizontal({
        root: sectionRef.current!,
        pinFrame: pinRef.current!,
        track: trackRef.current!,
        bgLayer: bgRef.current, // 섹션 배경 ref
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
      id="skills"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative overflow-hidden bg-neutral-950 text-white"
      aria-labelledby="skills-title"
    >
      

      <div ref={pinRef} className="skills-pin relative z-10">
        {/* 섹션 전체 배경 (요약 텍스트 아래까지 커버) */}
      <SectionBackground ref={bgRef} variant="skills" density={bgDensity} />
        <Container className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Skills
          </p>
          <h2 id="skills-title" className="text-3xl font-semibold md:text-4xl">
            이런 기술을 사용해 봤어요
          </h2>
        </Container>

        <div ref={trackRef} className="skills-track">
          {portfolio.skills.map((skill) => (
            <article
              key={skill.title}
              className="skills-card"
              aria-label={skill.title}
            >
              <h3 className="text-lg font-semibold text-white">{skill.title}</h3>
              <p className="text-sm text-white/70">{skill.problem}</p>
              <p className="text-sm text-white/70">{skill.approach}</p>
              <p className="text-sm text-white/70">{skill.result}</p>
            </article>
          ))}
        </div>
      </div>

      <Container className="relative z-10">
        <p className="mt-10 max-w-2xl text-base text-white/70">
          {portfolio.skillsSummary}
        </p>
      </Container>
    </section>
  );
};
