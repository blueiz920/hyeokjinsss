"use client";

import { useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";

export const SkillsHorizontal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { register, unregister } = useSectionRegistry();

  useEffect(() => {
    if (!sectionRef.current) return;
    register("skills", sectionRef);
    return () => unregister("skills");
  }, [register, unregister]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      tabIndex={-1}
      className="skills-static-section section-padding bg-neutral-950 text-white"
      aria-labelledby="skills-title"
    >
      <Container>
        <div className="skills-static-header">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Skills
          </p>
          <h2 id="skills-title" className="text-3xl font-semibold md:text-4xl">
            문제를 해결하는{" "}
            <span className="block sm:inline">다섯 가지 방식</span>
          </h2>
        </div>
      </Container>

      <div className="skills-expertise-grid">
        <div className="skills-expertise-visual">
          <div className="skills-expertise-visual-inner">
            <p className="skills-expertise-label">Core stack</p>
            <div className="skills-expertise-tools" data-skill-tools>
              {portfolio.skills
                .flatMap((skill) => skill.tools)
                .map((tool) => (
                  <span key={tool} className="skills-tool-wordmark">
                    {tool}
                  </span>
                ))}
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
                Capability {String(index + 1).padStart(2, "0")}
              </p>
              <h3
                id={`skill-title-${index}`}
                className="skills-capability-title"
              >
                {skill.title}
              </h3>
              <p className="skills-capability-summary">{skill.summary}</p>
              <dl className="skills-capability-details">
                <div>
                  <dt>Project</dt>
                  <dd>{skill.project}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
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
