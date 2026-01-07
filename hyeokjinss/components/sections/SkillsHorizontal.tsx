"use client";

import { useEffect, useRef } from "react";
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
        bgLayer: bgRef.current, // ✅ 추가
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

  const { density } = getMotionProfile(prefersReducedMotion);

  return (
    <section
      id="skills"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding bg-neutral-950 text-white"
      aria-labelledby="skills-title"
    >
      <div ref={pinRef} className="skills-pin relative overflow-hidden">
        {/* ✅ 배경 레이어 */}
        <SectionBackground
          ref={bgRef}
          variant="skills"
          density={density + 6} // skills는 가로 스크롤이라 좀 더 깔아도 괜찮음
        />

        <Container className="relative z-10 space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Skills horizontal
          </p>
          <h2 id="skills-title" className="text-3xl font-semibold md:text-4xl">
            Problem → Approach → Result
          </h2>
        </Container>

        <div ref={trackRef} className="skills-track relative z-10">
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

      <Container className="relative">
        <p className="mt-10 max-w-2xl text-base text-white/70">
          {portfolio.skillsSummary}
        </p>
      </Container>
    </section>
  );
};
