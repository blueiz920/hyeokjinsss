"use client";

import { useEffect, useRef } from "react";
import { TransitionLink } from "@/components/common/TransitionLink";
import { portfolio } from "@/data/portfolio";
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
  const githubLink = portfolio.socials.find(
    ({ kind, href: socialHref }) =>
      kind === "github" && socialHref.startsWith("http"),
  );
  const contactHref = portfolio.contactEmail
    ? `mailto:${portfolio.contactEmail}`
    : undefined;

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
        <div className="project-detail-next-project">
          <p className="project-detail-next-eyebrow">Next project</p>
          <div className="project-detail-next-row">
            <TransitionLink
              href={href}
              label={title}
              className="project-detail-next-link"
            >
              <span id="next-project-title">{title}</span>
              <span aria-hidden="true">↗</span>
            </TransitionLink>
            <TransitionLink
              href="/#projects"
              label="project"
              className="project-detail-next-all"
            >
              전체 프로젝트
            </TransitionLink>
          </div>
        </div>

        <div className="project-detail-next-divider" aria-hidden="true" />

        <div className="project-detail-close-grid">
          <div className="project-detail-close-copy">
            <p className="project-detail-close-eyebrow">Contact</p>
            <h2>
              <span>다음 경험을</span>
              <span>함께 만들어요.</span>
            </h2>
          </div>

          <nav
            className="project-detail-close-nav project-detail-navigate"
            aria-label="사이트 섹션 바로가기"
          >
            <p className="project-detail-close-eyebrow">Navigate</p>
            <ul className="project-detail-navigate-links">
              {portfolio.nav
                .filter(({ id }) => id !== "intro")
                .map((item) => (
                  <li key={item.id}>
                    <TransitionLink
                      href={`/#${item.id}`}
                      label={item.label}
                    >
                      {item.label}
                    </TransitionLink>
                  </li>
                ))}
            </ul>
          </nav>

          <nav
            className="project-detail-close-nav project-detail-elsewhere"
            aria-label="프로젝트 상세 외부 링크"
          >
            <p className="project-detail-close-eyebrow">Elsewhere</p>
            <ul className="project-detail-close-links">
              {contactHref ? (
                <li>
                  <a href={contactHref}>연락하기</a>
                </li>
              ) : null}
              {githubLink ? (
                <li>
                  <a
                    href={githubLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${githubLink.label} 새 탭에서 열기`}
                  >
                    {githubLink.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};
