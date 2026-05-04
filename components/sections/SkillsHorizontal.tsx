"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { SkillsBackground } from "@/components/sections/SkillsBackground";
import { initSkillsBackgroundMotion } from "@/lib/animation/skillsBackground";
import { initSkillsHorizontal } from "@/lib/animation/skillsHorizontal";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";

export const SkillsHorizontal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

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
        pinFrame: pinRef.current!,
        track: trackRef.current!,
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

  useEffect(() => {
    const root = backgroundRef.current;
    const trigger = pinRef.current;
    if (!root || !trigger) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initSkillsBackgroundMotion({
        root,
        trigger,
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
        <SkillsBackground ref={backgroundRef} />

        <Container className="relative z-10 space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Skills
          </p>
          <h2 id="skills-title" className="text-3xl font-semibold md:text-4xl">
            이런 기술을 사용해 봤어요
          </h2>
        </Container>

        <div ref={trackRef} className="skills-track relative z-10">
          {portfolio.skills.map((skill) => (
            <article
              key={skill.title}
              className="skills-card"
              data-skill-card
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

      {/* <Container className="relative z-10">
        <p className="mt-10 max-w-2xl text-base text-white/70">
          {portfolio.skillsSummary}
        </p>
      </Container> */}
    </section>
  );
};
