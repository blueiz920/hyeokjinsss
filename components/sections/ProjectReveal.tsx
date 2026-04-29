"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { ProjectRevealCard } from "@/components/common/ProjectRevealCard";
import { getProjectCardIndex } from "@/lib/animation/projectReveal";

export const ProjectReveal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const { setProjectsActive, setProjectsStep, setProjectsTotal } =
    useScrollIndicators();

  useEffect(() => {
    setProjectsTotal(portfolio.projects.length);
  }, [setProjectsTotal]);

  useEffect(() => {
    if (!sectionRef.current) return;
    register("projects", sectionRef);
    return () => unregister("projects");
  }, [register, unregister]);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current.filter(
      (card): card is HTMLElement => Boolean(card),
    );

    if (!section || cards.length === 0) return;

    const syncIndicators = () => {
      const sectionRect = section.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const active =
        sectionRect.top <= viewportCenter && sectionRect.bottom >= viewportCenter;

      setProjectsActive(active);

      if (active) {
        setProjectsStep(getProjectCardIndex(cards));
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0,
    };

    const sectionObserver = new IntersectionObserver(syncIndicators, observerOptions);
    const cardObserver = new IntersectionObserver(syncIndicators, observerOptions);

    sectionObserver.observe(section);
    cards.forEach((card) => cardObserver.observe(card));
    syncIndicators();

    return () => {
      sectionObserver.disconnect();
      cardObserver.disconnect();
      setProjectsActive(false);
    };
  }, [setProjectsActive, setProjectsStep]);

  return (
    <section
      id="projects"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative bg-neutral-950 text-white"
      aria-labelledby="projects-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="project-reveal-bg absolute inset-0" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-neutral-950 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950 to-transparent" />
        </div>
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
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
