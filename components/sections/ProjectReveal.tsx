"use client";

import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";
import { ProjectRevealCard } from "@/components/common/ProjectRevealCard";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

export const ProjectReveal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const { setProjectsTotal } = useScrollIndicators();
  const [bgDensity, setBgDensity] = useState(14);

  useEffect(() => {
    setProjectsTotal(portfolio.projects.length);
  }, [setProjectsTotal]);

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

  return (
    <section
      id="projects"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative bg-neutral-950 text-white"
      aria-labelledby="projects-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <SectionBackground variant="projects" density={bgDensity} />
      </div>

      <Container className="relative z-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-14">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Project
            </p>
            <h2 id="projects-title" className="text-3xl font-semibold md:text-4xl">
              이런 프로젝트에 참여했어요
            </h2>
          </aside>

          <div className="space-y-8">
            {portfolio.projects.map((project, index) => (
              <ProjectRevealCard
                key={project.slug}
                ref={(node) => {
                  cardsRef.current[index] = node;
                }}
                project={project}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
