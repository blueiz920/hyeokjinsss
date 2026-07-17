"use client";

import { useEffect, useRef, useState } from "react";
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
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "static">(
    "horizontal",
  );

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  useEffect(() => {
    if (!sectionRef.current) return;
    register("skills", sectionRef);
    return () => unregister("skills");
  }, [register, unregister]);

  useEffect(() => {
    const pinFrame = pinRef.current;
    const track = trackRef.current;
    if (!sectionRef.current || !pinFrame || !track) return;

    let isActive = true;
    let cleanupMotion: (() => void) | null = null;

    // 가로 모션 초기화에 실패한 현재 effect만 정적 목록으로 복구한다.
    // 종료된 effect의 늦은 결과는 상태를 바꾸지 않고 성공한 자원만 즉시 정리한다.
    (async () => {
      try {
        const cleanup = await initSkillsHorizontal({
          pinFrame,
          track,
          prefersReducedMotion,
        });

        if (!isActive) {
          cleanup();
          return;
        }
        cleanupMotion = cleanup;
        setLayoutMode("horizontal");
      } catch (error) {
        if (!isActive) return;
        setLayoutMode("static");
        console.error(
          "Skills horizontal motion failed; using the static layout.",
          error,
        );
      }
    })();

    return () => {
      isActive = false;
      cleanupMotion?.();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const backgroundRoot = backgroundRef.current;
    const pinFrame = pinRef.current;
    if (!backgroundRoot || !pinFrame) return;

    let isActive = true;
    let cleanupMotion: (() => void) | null = null;

    // 배경 모션 실패는 카드 레이아웃과 분리해 기본 비활성 배경으로 복구한다.
    // 종료된 effect의 늦은 실패는 기록하지 않고 성공한 자원만 즉시 정리한다.
    (async () => {
      try {
        const cleanup = await initSkillsBackgroundMotion({
          root: backgroundRoot,
          trigger: pinFrame,
          prefersReducedMotion,
        });

        if (!isActive) {
          cleanup();
          return;
        }

        cleanupMotion = cleanup;
      } catch (error) {
        if (!isActive) return;
        backgroundRoot.dataset.circuitActive = "false";
        console.error(
          "Skills background motion failed; using the static background.",
          error,
        );
      }
    })();

    return () => {
      isActive = false;
      cleanupMotion?.();
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
      <div
        ref={pinRef}
        className="skills-pin relative z-10"
        data-layout={layoutMode}
      >
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
