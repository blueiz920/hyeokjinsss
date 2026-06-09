import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsBackgroundMotionOptions = {
  root: HTMLElement;
  trigger: HTMLElement;
  prefersReducedMotion: boolean;
};

type RunnerTimelineOptions = {
  paused?: boolean;
};

type ParallaxTargets = {
  grid: HTMLElement | null;
  atmosphere: HTMLElement | null;
  activeSvg: SVGSVGElement;
};

const MOBILE_QUERY = "(max-width: 767px)";

const getNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getActiveSvg = (root: HTMLElement, isMobile: boolean) =>
  root.querySelector<SVGSVGElement>(
    `[data-skills-bg-svg="${isMobile ? "mobile" : "desktop"}"]`,
  );

const getParallaxTargets = (
  root: HTMLElement,
  activeSvg: SVGSVGElement,
): ParallaxTargets => ({
  grid: root.querySelector<HTMLElement>('[data-parallax-layer="grid"]'),
  atmosphere: root.querySelector<HTMLElement>('[data-parallax-layer="atmosphere"]'),
  activeSvg,
});

const getParallaxElements = ({
  grid,
  atmosphere,
  activeSvg,
}: ParallaxTargets) =>
  [grid, atmosphere, activeSvg].filter(
    (target): target is HTMLElement | SVGSVGElement => Boolean(target),
  );

const getRunnerPath = (svg: SVGSVGElement, pathKey: string) => {
  const paths = Array.from(
    svg.querySelectorAll<SVGPathElement>("[data-motion-path]"),
  );

  return paths.find((path) => path.dataset.motionPath === pathKey) ?? null;
};

const clampRunnerProgress = (value: number) => Math.max(0, Math.min(0.98, value));
const REVEAL_TIME_SCALE = 1.25;
const GRID_PARALLAX_X = 8;
const ATMOSPHERE_PARALLAX_X = 24;
const DESKTOP_SVG_PARALLAX_X = 38;
const MOBILE_SVG_PARALLAX_X = 24;
const CARD_IGNITE_PEAK = 0.62;
const CARD_IGNITE_STABLE = 0.6;
const CARD_REDUCED_MOTION_STABLE = 0.18;
const CARD_VAR_NAMES = [
  "--skill-card-ignite",
  "--skill-card-scan",
  "--skill-card-scan-scale",
] as const;

const cardVars = {
  "--skill-card-ignite": 0,
  "--skill-card-scan": 0,
  "--skill-card-scan-scale": 0,
};

const getSkillCards = (trigger: HTMLElement) =>
  Array.from(trigger.querySelectorAll<HTMLElement>("[data-skill-card]"));

const setCardVars = (
  cards: HTMLElement[],
  vars: Partial<Record<(typeof CARD_VAR_NAMES)[number], number>>,
) => {
  cards.forEach((card) => {
    Object.entries(vars).forEach(([name, value]) => {
      card.style.setProperty(name, String(value));
    });
  });
};

const clearCardVars = (cards: HTMLElement[]) => {
  cards.forEach((card) => {
    CARD_VAR_NAMES.forEach((name) => {
      card.style.removeProperty(name);
    });
  });
};

export const initSkillsBackgroundMotion = async ({
  root,
  trigger,
  prefersReducedMotion,
}: SkillsBackgroundMotionOptions) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (prefersReducedMotion) {
    root.dataset.circuitActive = "true";
    const cards = getSkillCards(trigger);

    setCardVars(cards, {
      "--skill-card-ignite": CARD_REDUCED_MOTION_STABLE,
      "--skill-card-scan": 0,
      "--skill-card-scan-scale": 0,
    });

    return () => clearCardVars(cards);
  }

  const { gsap, ScrollTrigger } = await loadGsap();
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let activeTimelines: Array<gsap.core.Timeline> = [];
  let activeTriggers: Array<{ kill: () => void }> = [];
  let activeParallaxTargets: ParallaxTargets | null = null;
  let hasRevealed = false;

  const clearRunnerStyles = () => {
    root
      .querySelectorAll<SVGGElement>("[data-runner-path]")
      .forEach((runner) => {
        gsap.set(runner, { clearProps: "all" });
      });
  };

  const clearCardStyles = () => {
    gsap.set(getSkillCards(trigger), {
      clearProps:
        "--skill-card-ignite,--skill-card-scan,--skill-card-scan-scale",
    });
  };

  const clearRevealStyles = () => {
    root
      .querySelectorAll<SVGPathElement>("[data-reveal-mode]")
      .forEach((path) => {
        gsap.set(path, {
          clearProps: "opacity,strokeWidth,strokeDasharray,strokeDashoffset",
        });
      });

    root
      .querySelectorAll<SVGElement>(".skills-bg__node, .skills-bg__dot-train")
      .forEach((element) => {
        gsap.set(element, { clearProps: "opacity,scale,transformOrigin" });
      });
  };

  const clearParallaxStyles = () => {
    if (!activeParallaxTargets) return;

    gsap.set(getParallaxElements(activeParallaxTargets), {
      clearProps: "transform,willChange",
    });
    activeParallaxTargets = null;
  };

  const killActiveMotion = () => {
    activeTriggers.forEach((triggerInstance) => triggerInstance.kill());
    activeTriggers = [];
    activeTimelines.forEach((timeline) => timeline.kill());
    activeTimelines = [];
    clearRevealStyles();
    clearCardStyles();
    clearRunnerStyles();
    clearParallaxStyles();
  };

  const createRunnerTimeline = (
    activeSvg: SVGSVGElement,
    runner: SVGGElement,
    { paused = false }: RunnerTimelineOptions = {},
  ) => {
    const pathKey = runner.dataset.runnerPath;
    if (!pathKey) return null;

    const path = getRunnerPath(activeSvg, pathKey);
    if (!path) return null;

    const duration = getNumber(runner.dataset.runnerDuration, 12);
    const offset = getNumber(runner.dataset.runnerOffset, 0);
    const fadeDuration = Math.min(1.2, duration * 0.14);
    const timeline = gsap.timeline({ paused, repeat: -1 });

    gsap.set(runner, {
      autoAlpha: 0,
      x: 0,
      y: 0,
      transformOrigin: "50% 50%",
    });

    timeline.to(
      runner,
      {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
        },
        duration,
        ease: "none",
      },
      0,
    );

    timeline.to(
      runner,
      {
        autoAlpha: 1,
        duration: fadeDuration,
        ease: "power1.out",
      },
      0.1,
    );

    timeline.to(
      runner,
      {
        autoAlpha: 0,
        duration: fadeDuration,
        ease: "power1.in",
      },
      duration - fadeDuration,
    );

    timeline.progress(clampRunnerProgress(offset));

    return timeline;
  };

  const setupRunnerTimelines = (
    activeSvg: SVGSVGElement,
    options?: RunnerTimelineOptions,
  ) => {
    const runners = Array.from(
      activeSvg.querySelectorAll<SVGGElement>("[data-runner-path]"),
    );

    return runners.flatMap((runner) => {
      const timeline = createRunnerTimeline(activeSvg, runner, options);
      return timeline ? [timeline] : [];
    });
  };

  const setupParallaxTimeline = (targets: ParallaxTargets) => {
    const { grid, atmosphere, activeSvg } = targets;
    const svgDistance = mobileMedia.matches
      ? MOBILE_SVG_PARALLAX_X
      : DESKTOP_SVG_PARALLAX_X;
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    gsap.set(getParallaxElements(targets), { willChange: "transform" });

    if (grid) {
      timeline.fromTo(
        grid,
        { x: -GRID_PARALLAX_X },
        { x: GRID_PARALLAX_X, ease: "none" },
        0,
      );
    }

    if (atmosphere) {
      timeline.fromTo(
        atmosphere,
        { x: ATMOSPHERE_PARALLAX_X },
        { x: -ATMOSPHERE_PARALLAX_X, ease: "none" },
        0,
      );
    }

    timeline.fromTo(
      activeSvg,
      { x: -svgDistance },
      { x: svgDistance, ease: "none" },
      0,
    );

    return timeline;
  };

  const setFinalActiveState = (activeSvg: SVGSVGElement) => {
    root.dataset.circuitActive = "true";

    gsap.set(activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="draw"]'), {
      strokeDasharray: 1,
      strokeDashoffset: 0,
    });

    gsap.set(getSkillCards(trigger), {
      "--skill-card-ignite": CARD_IGNITE_STABLE,
      "--skill-card-scan": 0,
      "--skill-card-scan-scale": 0,
    });
  };

  const createRevealTimeline = (
    activeSvg: SVGSVGElement,
    runnerTimelines: Array<gsap.core.Timeline>,
  ) => {
    const drawPaths = Array.from(
      activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="draw"]'),
    );
    const fadePaths = Array.from(
      activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="fade"]'),
    );
    const glowPaths = Array.from(
      activeSvg.querySelectorAll<SVGPathElement>(".skills-bg__glow-lines [data-reveal-mode]"),
    );
    const primaryGlowPaths = Array.from(
      activeSvg.querySelectorAll<SVGPathElement>(
        '.skills-bg__glow-lines .skills-bg__path--primary[data-reveal-mode="draw"]',
      ),
    );
    const secondaryGlowPaths = Array.from(
      activeSvg.querySelectorAll<SVGPathElement>(
        '.skills-bg__glow-lines .skills-bg__path--secondary[data-reveal-mode="draw"]',
      ),
    );
    const nodes = Array.from(activeSvg.querySelectorAll<SVGElement>(".skills-bg__node"));
    const dotTrains = Array.from(activeSvg.querySelectorAll<SVGElement>(".skills-bg__dot-train"));
    const cards = getSkillCards(trigger);
    // fade 계열은 peak와 stable 차이를 줄여서 켜졌다 꺼지는 느낌을 막음.
    const fadeSharpPaths = fadePaths.filter(
      (path) => !path.closest(".skills-bg__glow-lines"),
    );
    const secondaryFadeGlowPaths = fadePaths.filter(
      (path) =>
        path.closest(".skills-bg__glow-lines") &&
        path.classList.contains("skills-bg__path--secondary"),
    );
    const atmosphericFadeGlowPaths = fadePaths.filter(
      (path) =>
        path.closest(".skills-bg__glow-lines") &&
        path.classList.contains("skills-bg__path--atmospheric"),
    );

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        hasRevealed = true;
        setFinalActiveState(activeSvg);
        gsap.set([...fadePaths, ...glowPaths, ...nodes, ...dotTrains], {
          clearProps: "opacity,strokeWidth,scale,transformOrigin",
        });
      },
    });
    // 전체 점등 속도만 늦추려고 timeline 자체 속도를 조정함.
    timeline.timeScale(1 / REVEAL_TIME_SCALE);

    timeline.set(
      drawPaths,
      {
        strokeDasharray: 1,
        strokeDashoffset: 1,
      },
      0,
    );

    timeline.set([...fadePaths, ...glowPaths], { opacity: 0 }, 0);
    timeline.set(cards, cardVars, 0);
    timeline.set(
      [...nodes, ...dotTrains],
      {
        opacity: 0.28,
        transformOrigin: "50% 50%",
      },
      0,
    );

    timeline.call(() => {
      root.dataset.circuitActive = "true";
    }, undefined, 0);

    timeline.to(
      fadeSharpPaths,
      {
        opacity: 0.84,
        duration: 0.42,
        ease: "power1.out",
        stagger: 0.035,
      },
      0.08,
    );

    timeline.to(
      secondaryFadeGlowPaths,
      {
        opacity: 0.24,
        duration: 0.28,
        ease: "power1.out",
        stagger: 0.035,
      },
      0.1,
    );

    timeline.to(
      atmosphericFadeGlowPaths,
      {
        opacity: 0.14,
        duration: 0.28,
        ease: "power1.out",
        stagger: 0.035,
      },
      0.1,
    );

    timeline.to(
      secondaryFadeGlowPaths,
      {
        opacity: 0.17,
        duration: 0.48,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.48,
    );

    timeline.to(
      atmosphericFadeGlowPaths,
      {
        opacity: 0.1,
        duration: 0.48,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.48,
    );

    timeline.to(
      drawPaths.filter((path) => path.classList.contains("skills-bg__path--secondary")),
      {
        strokeDashoffset: 0,
        duration: 0.72,
        ease: "power2.out",
        stagger: 0.05,
      },
      0.16,
    );

    timeline.to(
      secondaryGlowPaths,
      {
        opacity: 0.44,
        strokeWidth: 7.4,
        duration: 0.065,
        repeat: 2,
        yoyo: true,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.23,
    );

    timeline.to(
      secondaryGlowPaths,
      {
        opacity: 0.18,
        strokeWidth: 4.8,
        duration: 0.42,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.5,
    );

    timeline.to(
      drawPaths.filter((path) => path.classList.contains("skills-bg__path--primary")),
      {
        strokeDashoffset: 0,
        duration: 0.82,
        ease: "power2.out",
        stagger: 0.06,
      },
      0.3,
    );

    timeline.to(
      primaryGlowPaths,
      {
        opacity: 0.58,
        strokeWidth: 9,
        duration: 0.07,
        repeat: 2,
        yoyo: true,
        ease: "power2.out",
        stagger: 0.04,
      },
      0.38,
    );

    timeline.to(
      primaryGlowPaths,
      {
        opacity: 0.22,
        strokeWidth: 6.5,
        duration: 0.48,
        ease: "power2.out",
        stagger: 0.04,
      },
      0.66,
    );

    timeline.to(
      nodes,
      {
        opacity: 1,
        scale: 1.2,
        duration: 0.08,
        repeat: 1,
        yoyo: true,
        ease: "power2.out",
        stagger: 0.025,
      },
      0.56,
    );

    // scan은 진행바처럼 보이지 않게 짧은 전류 조각 리듬으로 튀게 함.
    timeline.set(
      cards,
      {
        "--skill-card-scan": 0,
        "--skill-card-scan-scale": 0.14,
      },
      0.7,
    );

    timeline.to(
      cards,
      {
        "--skill-card-scan": 1,
        "--skill-card-scan-scale": 0.68,
        duration: 0.065,
        ease: "power3.out",
        stagger: 0.045,
      },
      0.72,
    );

    timeline.to(
      cards,
      {
        "--skill-card-scan": 0.38,
        "--skill-card-scan-scale": 0.42,
        duration: 0.045,
        ease: "none",
        stagger: 0.045,
      },
      0.8,
    );

    timeline.to(
      cards,
      {
        "--skill-card-scan": 0.92,
        "--skill-card-scan-scale": 0.96,
        duration: 0.055,
        ease: "power3.out",
        stagger: 0.045,
      },
      0.86,
    );

    timeline.to(
      dotTrains,
      {
        opacity: 0.72,
        duration: 0.44,
        ease: "power2.out",
        stagger: 0.018,
      },
      0.62,
    );

    timeline.to(
      cards,
      {
        "--skill-card-ignite": CARD_IGNITE_PEAK,
        duration: 0.28,
        ease: "power2.out",
        stagger: 0.05,
      },
      0.78,
    );

    timeline.to(
      nodes,
      {
        opacity: 1,
        scale: 1,
        duration: 0.32,
        ease: "power2.out",
        stagger: 0.025,
      },
      0.74,
    );

    timeline.to(
      cards,
      {
        "--skill-card-scan": 0,
        "--skill-card-scan-scale": 1,
        duration: 0.2,
        ease: "power2.out",
        stagger: 0.04,
      },
      1.02,
    );

    timeline.to(
      cards,
      {
        "--skill-card-ignite": CARD_IGNITE_STABLE,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.035,
      },
      1.12,
    );

    timeline.call(() => {
      runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
    }, undefined, 0.84);

    return timeline;
  };

  const setupActiveSvg = () => {
    killActiveMotion();

    // 브레이크포인트 기준으로 보이는 SVG 하나만 잡아서 중복 runner를 막음.
    const activeSvg = getActiveSvg(root, mobileMedia.matches);
    if (!activeSvg) return;

    // 이전 브레이크포인트의 parallax transform을 지우려고 active target을 저장함.
    activeParallaxTargets = getParallaxTargets(root, activeSvg);

    const runnerTimelines = setupRunnerTimelines(activeSvg, { paused: true });
    // parallax는 ScrollTrigger 하나에 묶어서 중복 trigger 생성을 막음.
    const parallaxTimeline = setupParallaxTimeline(activeParallaxTargets);
    const parallaxTrigger = parallaxTimeline.scrollTrigger;

    if (hasRevealed) {
      setFinalActiveState(activeSvg);
      runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
      activeTimelines = [...runnerTimelines, parallaxTimeline];
      activeTriggers = parallaxTrigger ? [parallaxTrigger] : [];
      return;
    }

    root.dataset.circuitActive = "false";

    // reveal은 한 번만 켜져야 장식처럼 반복되지 않아서 trigger와 분리함.
    const revealTimeline = createRevealTimeline(activeSvg, runnerTimelines);
    const revealTrigger = ScrollTrigger.create({
      trigger,
      start: "top 38%",
      once: true,
      onEnter: () => revealTimeline.play(0),
    });

    activeTimelines = [revealTimeline, ...runnerTimelines, parallaxTimeline];
    activeTriggers = parallaxTrigger
      ? [revealTrigger, parallaxTrigger]
      : [revealTrigger];
  };

  const handleBreakpointChange = () => {
    // 화면 크기 변화마다 재생성하지 않고 breakpoint가 바뀔 때만 다시 맞춤.
    setupActiveSvg();
  };

  setupActiveSvg();
  mobileMedia.addEventListener("change", handleBreakpointChange);

  return () => {
    mobileMedia.removeEventListener("change", handleBreakpointChange);
    killActiveMotion();
  };
};
