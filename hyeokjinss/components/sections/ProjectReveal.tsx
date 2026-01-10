"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { initProjectReveal } from "@/lib/animation/projectReveal";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

export const ProjectReveal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  // SSR/CSR 첫 렌더 동일하게(하이드레이션 이슈 방지)
  const [bgDensity, setBgDensity] = useState(14);

  useEffect(() => {
  const id = requestAnimationFrame(() => {
    const { density } = getMotionProfile(prefersReducedMotion);
    const next = density + 14;

    setBgDensity((prev) => (prev === next ? prev : next));
  });

  return () => cancelAnimationFrame(id);
}, [prefersReducedMotion]);


  useEffect(() => {
    if (!sectionRef.current) return;
    register("projects", sectionRef);
    return () => unregister("projects");
  }, [register, unregister]);

  useEffect(() => {
    if (!sectionRef.current || !pinRef.current || !stageRef.current) return;

    const cards = cardsRef.current.filter(
      (card): card is HTMLElement => Boolean(card),
    );

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initProjectReveal({
        root: sectionRef.current!,
        pinFrame: pinRef.current!,
        stage: stageRef.current!,
        cards,
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
      id="projects"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative overflow-hidden bg-neutral-950 text-white"
      aria-labelledby="projects-title"
    >
      

      <div ref={pinRef} className="project-pin relative z-10">
        {/* 섹션 전체 배경 */}
      <SectionBackground ref={bgRef} variant="projects" density={bgDensity} />
        <Container className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Project
          </p>
          <h2 id="projects-title" className="text-3xl font-semibold md:text-4xl">
            이런 프로젝트에 참여했어요
          </h2>
        </Container>
        <div ref={stageRef} className="project-stage">
          {portfolio.projects.map((project, index) => (
            <article
              key={project.slug}
              ref={(node) => {
                cardsRef.current[index] = node;
              }}
              className="project-card"
              aria-label={project.title}
            >
              <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {project.role}
                  </p>
                  <h3 className="text-2xl font-semibold md:text-3xl">
                    {project.title}
                  </h3>
                  <p className="text-base text-white/70">{project.summary}</p>
                  <p className="text-sm text-white/60">{project.impact}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm">
                    {project.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline decoration-white/40 underline-offset-4"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
