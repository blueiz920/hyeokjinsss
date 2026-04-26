"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SectionBackground } from "@/components/common/SectionBackground";
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
              <article
                key={project.slug}
                ref={(node) => {
                  cardsRef.current[index] = node;
                }}
                className="project-card"
                aria-label={project.title}
              >
                <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
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
      </Container>
    </section>
  );
};
