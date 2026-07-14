"use client";

import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { ProjectRevealCard } from "@/components/common/ProjectRevealCard";
import { getProjectCardIndex } from "@/lib/animation/projectReveal";

// 프로젝트 카드와 배경 reveal을 렌더링하고 전역 진행 indicator를 동기화한다.
export const ProjectReveal = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgFrameRef = useRef<HTMLDivElement | null>(null);
  const projectCardsRef = useRef<Array<HTMLElement | null>>([]);
  const [bgActive, setBgActive] = useState(false);

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const { setProjectsActive, setProjectsStep, setProjectsTotal } =
    useScrollIndicators();

  // 실제 프로젝트 카드 수를 전역 indicator 상태에 반영한다.
  useEffect(() => {
    setProjectsTotal(portfolio.projects.length);
  }, [setProjectsTotal]);

  // 공용 내비게이션이 프로젝트 section으로 이동할 수 있도록 ref를 등록한다.
  useEffect(() => {
    if (!sectionRef.current) return;
    register("projects", sectionRef);
    return () => unregister("projects");
  }, [register, unregister]);

  // 배경 frame의 노출 비율에 hysteresis를 적용해 경계 깜빡임을 막는다.
  useEffect(() => {
    const backgroundFrame = bgFrameRef.current;

    if (!backgroundFrame) return;

    const activateRatio = 0.70;
    const deactivateRatio = 0.68;

    const bgObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        // 켜짐/꺼짐 기준을 분리해서 경계 깜빡임을 줄임.
        setBgActive((previousActive) => {
          if (entry.intersectionRatio >= activateRatio) return true;
          if (
            !entry.isIntersecting ||
            entry.intersectionRatio <= deactivateRatio
          ) {
            return false;
          }
          return previousActive;
        });
      },
      {
        root: null,
        threshold: [0, deactivateRatio, activateRatio, 1],
      },
    );

    bgObserver.observe(backgroundFrame);

    return () => {
      bgObserver.disconnect();
      setBgActive(false);
    };
  }, []);

  // section과 카드가 화면 중앙을 지날 때 indicator의 표시 여부와 단계를 갱신한다.
  useEffect(() => {
    const section = sectionRef.current;
    const projectCards = projectCardsRef.current.filter(
      (card): card is HTMLElement => Boolean(card),
    );

    if (!section || projectCards.length === 0) return;

    // 현재 DOM 위치를 다시 읽어 section 활성 상태와 가장 가까운 카드를 계산한다.
    const syncProjectIndicator = () => {
      const sectionRect = section.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionActive =
        sectionRect.top <= viewportCenter && sectionRect.bottom >= viewportCenter;

      setProjectsActive(sectionActive);

      if (sectionActive) {
        setProjectsStep(getProjectCardIndex(projectCards));
      }
    };

    // viewport 중앙 10% 영역을 section과 카드의 진입·이탈 기준으로 사용한다.
    const indicatorOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0,
    };

    const sectionObserver = new IntersectionObserver(
      syncProjectIndicator,
      indicatorOptions,
    );
    const cardObserver = new IntersectionObserver(
      syncProjectIndicator,
      indicatorOptions,
    );

    sectionObserver.observe(section);
    projectCards.forEach((card) => cardObserver.observe(card));
    syncProjectIndicator();

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
      className="project-section section-padding relative bg-neutral-950 text-white"
      data-bg-active={bgActive ? "true" : "false"}
      aria-labelledby="projects-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div
          ref={bgFrameRef}
          className="project-reveal-stage sticky top-0 h-screen overflow-hidden"
          data-bg-active={bgActive ? "true" : "false"}
        >
          <div className="project-reveal-bg absolute inset-0" />
          <div className="project-reveal-veil project-reveal-veil-top" />
          <div className="project-reveal-veil project-reveal-veil-bottom" />
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
                ref={(cardNode) => {
                  projectCardsRef.current[index] = cardNode;
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
