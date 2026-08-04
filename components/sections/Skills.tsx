"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { initSkillsIntro } from "@/lib/animation/skillsIntro";
import { initSkillsVisual } from "@/lib/animation/skillsVisual";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SkillMark } from "./SkillMark";

const skillTitleLines = ["문제를 해결하는", "다섯 가지 방식"] as const;

export const Skills = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [activeCapability, setActiveCapability] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const { lockScroll, prefersReducedMotion, unlockScroll } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const pageTotal = portfolio.skills.length;

  const updatePage = () => {
    const deck = deckRef.current;
    if (!deck || deck.clientWidth === 0) return;

    const nextPage = Math.round(deck.scrollLeft / deck.clientWidth);
    setActivePage(Math.min(Math.max(nextPage, 0), pageTotal - 1));
  };

  const movePage = (offset: number) => {
    const deck = deckRef.current;
    const nextPage = Math.min(
      Math.max(activePage + offset, 0),
      pageTotal - 1,
    );

    setActivePage(nextPage);
    deck?.scrollTo?.({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      left: nextPage * deck.clientWidth,
    });
  };

  useEffect(() => {
    if (!sectionRef.current) return;
    register("skills", sectionRef);
    return () => unregister("skills");
  }, [register, unregister]);

  useEffect(() => {
    const query = window.matchMedia?.("(min-width: 1024px)");
    if (!query) return;

    const updateDesktop = () => setIsDesktop(query.matches);
    updateDesktop();
    query.addEventListener("change", updateDesktop);

    return () => query.removeEventListener("change", updateDesktop);
  }, []);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    let isActive = true;
    const cleanups = new Set<() => void>();

    const attachMotion = async (
      motion: Promise<() => void>,
      label: string,
    ) => {
      try {
        const cleanup = await motion;
        if (!isActive) {
          cleanup();
          return;
        }
        cleanups.add(cleanup);
      } catch (error) {
        if (!isActive) return;
        if (label === "intro") root.dataset.skillPanelReady = "true";
        console.error(
          `Skills ${label} motion failed; using the static layout.`,
          error,
        );
      }
    };

    void attachMotion(
      initSkillsIntro({ lockScroll, prefersReducedMotion, root, unlockScroll }),
      "intro",
    );
    void attachMotion(
      initSkillsVisual({ prefersReducedMotion, root }),
      "visual",
    );

    return () => {
      isActive = false;
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      delete root.dataset.skillPanelReady;
    };
  }, [lockScroll, prefersReducedMotion, unlockScroll]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      tabIndex={-1}
      className="skills-static-section bg-neutral-950 text-white"
      aria-labelledby="skills-title"
    >
      <div className="skills-expertise-grid">
        <header className="skills-expertise-intro" data-skill-intro>
          <p className="skills-expertise-eyebrow">Skills</p>
          <h2
            id="skills-title"
            className="skills-expertise-title"
            aria-label="문제를 해결하는 다섯 가지 방식"
          >
            <span className="skills-title-lines" aria-hidden="true">
              {skillTitleLines.map((line, lineIndex) => (
                <span
                  key={line}
                  className="skills-title-line"
                  data-skill-title-line
                >
                  {Array.from(line).map((character, characterIndex) => (
                    <span
                      key={`${lineIndex}-${characterIndex}`}
                      className="skills-title-char"
                      data-skill-title-char
                    >
                      {character === " " ? "\u00a0" : character}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </h2>
          <p className="skills-expertise-description">
            기술을 나열하기보다, 실제 사용자 흐름과 엔지니어링 결과를 만든
            방식으로 묶었습니다.
          </p>
        </header>

        <div
          className="skills-expertise-visual"
          data-reduced-motion={prefersReducedMotion ? "true" : undefined}
        >
          <div className="skills-expertise-visual-inner">
            <div className="skills-expertise-stage">
              <div className="skills-expertise-photo" data-skill-photo>
                <Image
                  src="/skills/skills-editorial-v2.webp"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 0px"
                />
              </div>

              <div
                className="skills-expertise-board"
                data-skill-board
                role="group"
                aria-labelledby="skills-stack-label"
                tabIndex={0}
              >
                <div
                  className="skills-board-header"
                  data-skill-deck-header
                >
                  <p
                    id="skills-stack-label"
                    className="skills-expertise-label"
                  >
                    Selected stack
                  </p>
                  <p
                    className="skills-board-status"
                    data-skill-deck-status
                    aria-live="polite"
                  >
                    <span>{String(activePage + 1).padStart(2, "0")}</span>
                    <span aria-hidden="true"> / </span>
                    <span>{String(pageTotal).padStart(2, "0")}</span>
                  </p>
                </div>

                <div
                  id="skills-stack-pages"
                  ref={deckRef}
                  className="skills-board-viewport"
                  data-skill-deck
                  role="region"
                  aria-label="역량별 기술 스택"
                  onScroll={updatePage}
                >
                  <div
                    className="skills-board-pages"
                    data-skill-tools
                    role="list"
                  >
                    {portfolio.skills.map((skill, index) => (
                      <div
                        key={skill.title}
                        className="skills-board-page"
                        data-skill-deck-page
                        role="listitem"
                        aria-label={`${String(index + 1).padStart(2, "0")} / ${String(pageTotal).padStart(2, "0")} ${skill.title}`}
                      >
                        <div className="skills-board-page-meta" aria-hidden="true">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <span>{skill.title}</span>
                        </div>
                        <div className="skills-board-tools" role="list">
                          {skill.tools.map((tool) => (
                            <div
                              key={tool}
                              className="skills-tool"
                              data-skill-tool
                              role="listitem"
                            >
                              <span
                                className="skills-tool-stage"
                                aria-hidden="true"
                              >
                                <span className="skills-tool-logo-layer">
                                  <SkillMark name={tool} />
                                </span>
                                <span className="skills-tool-name-layer">
                                  {tool}
                                </span>
                              </span>
                              <span className="sr-only">{tool}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="skills-board-controls" data-skill-deck-controls>
                  <button
                    type="button"
                    aria-controls="skills-stack-pages"
                    aria-label="이전 기술 그룹 보기"
                    disabled={activePage === 0}
                    onClick={() => movePage(-1)}
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <button
                    type="button"
                    aria-controls="skills-stack-pages"
                    aria-label="다음 기술 그룹 보기"
                    disabled={activePage === pageTotal - 1}
                    onClick={() => movePage(1)}
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="skills-expertise-content" role="list">
          {portfolio.skills.map((skill, index) => {
            const isExpanded = isDesktop || activeCapability === index;
            const panelId = `skill-panel-${index}`;
            const triggerId = `skill-trigger-${index}`;

            return (
              <article
                key={skill.title}
                className="skills-capability"
                data-skill-capability
                data-open={isExpanded ? "true" : "false"}
                role="listitem"
                aria-labelledby={`skill-title-${index}`}
              >
                <p className="skills-capability-label">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(portfolio.skills.length).padStart(2, "0")}
                </p>
                <h3
                  id={`skill-title-${index}`}
                  className="skills-capability-title"
                >
                  <button
                    id={triggerId}
                    className="skills-capability-trigger"
                    type="button"
                    aria-controls={panelId}
                    aria-expanded={isExpanded}
                    disabled={isDesktop}
                    onClick={() => {
                      if (!isDesktop) setActiveCapability(index);
                    }}
                  >
                    <span className="skills-capability-name">{skill.title}</span>
                    <span
                      className="skills-capability-indicator"
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <p className="skills-capability-tools">
                  <span>Tools</span>
                  {skill.tools.join(" · ")}
                </p>
                <div
                  id={panelId}
                  className="skills-capability-panel"
                  data-skill-panel
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isExpanded}
                >
                  <div className="skills-capability-panel-inner">
                    <p className="skills-capability-summary">{skill.summary}</p>
                    <dl className="skills-capability-details">
                      <div>
                        <dt>적용 프로젝트</dt>
                        <dd>{skill.project}</dd>
                      </div>
                      <div>
                        <dt>결과</dt>
                        <dd>{skill.evidence}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
