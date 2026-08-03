"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { initSkillsIntro } from "@/lib/animation/skillsIntro";
import { initSkillsVisual } from "@/lib/animation/skillsVisual";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { SkillMark } from "./SkillMark";

const skillTitleLines = ["문제를 해결하는", "다섯 가지 방식"] as const;

export const Skills = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();

  useEffect(() => {
    if (!sectionRef.current) return;
    register("skills", sectionRef);
    return () => unregister("skills");
  }, [register, unregister]);

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
        console.error(
          `Skills ${label} motion failed; using the static layout.`,
          error,
        );
      }
    };

    void attachMotion(
      initSkillsIntro({ prefersReducedMotion, root }),
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
    };
  }, [prefersReducedMotion]);

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
              <p
                id="skills-stack-label"
                className="skills-expertise-label"
              >
                Selected stack
              </p>
              <div
                className="skills-expertise-tools"
                data-skill-tools
                role="list"
              >
                {portfolio.skills
                  .flatMap((skill) => skill.tools)
                  .map((tool) => (
                    <div
                      key={tool}
                      className="skills-tool"
                      data-skill-tool
                      role="listitem"
                    >
                      <span className="skills-tool-stage" aria-hidden="true">
                        <span className="skills-tool-logo-layer">
                          <SkillMark name={tool} />
                        </span>
                        <span className="skills-tool-name-layer">{tool}</span>
                      </span>
                      <span className="sr-only">{tool}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="skills-expertise-content" role="list">
          {portfolio.skills.map((skill, index) => (
            <article
              key={skill.title}
              className="skills-capability"
              data-skill-capability
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
                {skill.title}
              </h3>
              <p className="skills-capability-tools">
                <span>Tools</span>
                {skill.tools.join(" · ")}
              </p>
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
