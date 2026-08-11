"use client";

import { useEffect, useRef } from "react";
import { TransitionLink } from "@/components/common/TransitionLink";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { initFooterCurve } from "@/lib/animation/footerCurve";

type ProjectNextProps = {
  href: string;
  title: string;
};

export const ProjectNext = ({ href, title }: ProjectNextProps) => {
  const footerRef = useRef<HTMLElement | null>(null);
  const curveRef = useRef<HTMLDivElement | null>(null);
  const { prefersReducedMotion } = useScrollRuntime();

  useEffect(() => {
    const footer = footerRef.current;
    const curve = curveRef.current;
    if (!footer || !curve || prefersReducedMotion) return;

    let isActive = true;
    let cleanupCurve: (() => void) | null = null;

    void initFooterCurve({ footer, curve })
      .then((cleanup) => {
        if (!isActive) {
          cleanup();
          return;
        }

        cleanupCurve = cleanup;
      })
      .catch((error) => {
        if (!isActive) return;
        console.error(
          "Project footer curve failed; using the static curve.",
          error,
        );
      });

    return () => {
      isActive = false;
      cleanupCurve?.();
    };
  }, [prefersReducedMotion]);

  return (
    <footer
      ref={footerRef}
      className="project-detail-next"
      aria-labelledby="next-project-title"
    >
      <div
        ref={curveRef}
        className="project-detail-next-curve"
        aria-hidden="true"
      >
        <div />
      </div>
      <div className="project-detail-shell">
        <p>Next project</p>
        <TransitionLink
          href={href}
          label={title}
          className="project-detail-next-link"
        >
          <span id="next-project-title">{title}</span>
          <span aria-hidden="true">↗</span>
        </TransitionLink>
      </div>
    </footer>
  );
};
