"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { forwardRef, useCallback, useRef } from "react";
import type { Project } from "@/data/types";
import { useProjectCardMotion } from "@/lib/animation/projectReveal";

type ProjectRevealCardProps = {
  project: Project;
  prefersReducedMotion: boolean;
};

export const ProjectRevealCard = forwardRef<HTMLElement, ProjectRevealCardProps>(
  ({ project, prefersReducedMotion }, ref) => {
    const cardRef = useRef<HTMLElement | null>(null);
    const {
      cardStyle,
      enabled: motionEnabled,
      imageStyle,
    } = useProjectCardMotion(cardRef, prefersReducedMotion);

    // 부모 observer와 카드 motion이 같은 article을 보도록 ref를 합침.
    const setCardRef = useCallback(
      (node: HTMLElement | null) => {
        cardRef.current = node;

        if (typeof ref === "function") {
          ref(node);
          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    return (
      <motion.article
        ref={setCardRef}
        className="project-card group"
        aria-label={project.title}
        style={cardStyle}
      >
        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-8">
          <div className="space-y-3 md:space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
              {project.role}
            </p>
            <h3 className="text-2xl font-semibold md:text-3xl">
              {project.title}
            </h3>
            <p className="text-[0.95rem] leading-6 text-white/70 md:text-base md:leading-normal">
              {project.summary}
            </p>
            <p className="text-sm leading-6 text-white/60">{project.impact}</p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {project.stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/20 px-2.5 py-1 text-xs text-white/70 md:px-3"
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
                  rel="noopener noreferrer"
                  aria-label={`${project.title} ${link.label} 새 탭에서 열기`}
                  className="text-white underline decoration-amber-300/50 underline-offset-4 transition hover:text-amber-100 hover:decoration-amber-300 focus-visible:outline-amber-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:h-36 md:h-44">
            <motion.div
              className="absolute -inset-y-4 inset-x-0"
              style={imageStyle}
            >
              <div
                className={[
                  "relative h-full w-full",
                  motionEnabled
                    ? "transition-transform duration-500 ease-out group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
                    : "",
                ].join(" ")}
              >
                <Image
                  src={project.thumbnail}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.article>
    );
  },
);

ProjectRevealCard.displayName = "ProjectRevealCard";
