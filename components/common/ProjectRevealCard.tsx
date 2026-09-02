"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { forwardRef, useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Project } from "@/data/types";
import { TransitionLink } from "@/components/common/TransitionLink";
import { useProjectCardMotion } from "@/lib/animation/projectReveal";

type ProjectRevealCardProps = {
  project: Project;
  index: number;
  total: number;
  prefersReducedMotion: boolean;
  isDesktop?: boolean;
  onPointerEnter?: (event: ReactPointerEvent<HTMLElement>) => void;
};

export const ProjectRevealCard = forwardRef<HTMLElement, ProjectRevealCardProps>(
  (
    {
      project,
      index,
      total,
      prefersReducedMotion,
      isDesktop = false,
      onPointerEnter,
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLElement | null>(null);
    const { cardStyle, imageStyle } = useProjectCardMotion(
      cardRef,
      prefersReducedMotion || isDesktop,
    );

    // 부모 observer와 카드 motion이 같은 프로젝트 항목을 보도록 ref를 합친다.
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
      <motion.li
        ref={setCardRef}
        className="project-mobile-card project-list-item"
        aria-label={project.title}
        style={cardStyle}
        onPointerEnter={onPointerEnter}
      >
        <TransitionLink
          href={`/projects/${project.slug}`}
          label={project.title}
          className="project-mobile-route project-list-row"
          aria-label={`${project.title} 프로젝트 자세히 보기`}
        >
          <div
            className="project-mobile-media"
            data-project={project.slug}
          >
            <motion.div
              className="project-mobile-image-track"
              style={imageStyle}
            >
              <div className="project-mobile-image">
                <Image
                  src={project.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 104px) / 2), 40vw"
                />
              </div>
            </motion.div>
          </div>

          <div className="project-mobile-content">
            <div className="project-list-heading">
              <h3 className="project-mobile-title">{project.title}</h3>
              <div className="project-mobile-hairline" />
              <div className="project-mobile-meta">
                <p className="project-mobile-role">{project.role}</p>
                <p className="project-mobile-index">
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>
              </div>
              <p className="project-mobile-impact">{project.impact}</p>
            </div>

            <p className="project-mobile-summary">{project.summary}</p>
            <p className="project-mobile-stack">
              {project.stack.slice(0, 3).join(" · ")}
            </p>
          </div>
        </TransitionLink>

        <div className="project-mobile-links">
          {project.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} ${link.label} 새 탭에서 열기`}
              className="project-mobile-link"
            >
              {link.label}
            </a>
          ))}
        </div>
      </motion.li>
    );
  },
);

ProjectRevealCard.displayName = "ProjectRevealCard";
