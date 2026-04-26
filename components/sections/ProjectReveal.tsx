"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";
import { ProjectRevealCard } from "@/components/common/ProjectRevealCard";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

const getClosestCardIndex = (cards: HTMLElement[]) => {
  const viewportCenter = window.innerHeight / 2;

  return cards.reduce(
    (closest, card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index;
};

const PROJECT_BACKGROUND_DRIFT_PX = 120;

export const ProjectReveal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const { setProjectsActive, setProjectsStep, setProjectsTotal } =
    useScrollIndicators();
  const [bgDensity, setBgDensity] = useState(14);
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // 배경 wrapper만 움직여서 공통 SectionBackground 로직은 그대로 유지
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? [0, 0]
      : [0, PROJECT_BACKGROUND_DRIFT_PX],
  );

  useEffect(() => {
    setProjectsTotal(portfolio.projects.length);
  }, [setProjectsTotal]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true));

    return () => cancelAnimationFrame(id);
  }, []);

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
        setProjectsStep(getClosestCardIndex(cards));
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
          <motion.div
            className="absolute -inset-20"
            style={isMounted ? { y: backgroundY } : { y: 0 }}
          >
            <SectionBackground variant="projects" density={bgDensity} />
          </motion.div>
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
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
