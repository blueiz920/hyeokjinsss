import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsBackgroundMotionOptions = {
  root: HTMLElement;
  trigger: HTMLElement;
  prefersReducedMotion: boolean;
};

type RunnerTimelineOptions = {
  paused?: boolean;
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

const getRunnerPath = (svg: SVGSVGElement, pathKey: string) => {
  const paths = Array.from(
    svg.querySelectorAll<SVGPathElement>("[data-motion-path]"),
  );

  return paths.find((path) => path.dataset.motionPath === pathKey) ?? null;
};

const clampRunnerProgress = (value: number) => Math.max(0, Math.min(0.98, value));

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
    return () => {};
  }

  const { gsap, ScrollTrigger } = await loadGsap();
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let activeTimelines: Array<gsap.core.Timeline> = [];
  let activeTriggers: Array<{ kill: () => void }> = [];
  let hasRevealed = false;

  const clearRunnerStyles = () => {
    root
      .querySelectorAll<SVGGElement>("[data-runner-path]")
      .forEach((runner) => {
        gsap.set(runner, { clearProps: "all" });
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

  const killActiveMotion = () => {
    activeTriggers.forEach((triggerInstance) => triggerInstance.kill());
    activeTriggers = [];
    activeTimelines.forEach((timeline) => timeline.kill());
    activeTimelines = [];
    clearRevealStyles();
    clearRunnerStyles();
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

  const setFinalActiveState = (activeSvg: SVGSVGElement) => {
    root.dataset.circuitActive = "true";

    gsap.set(activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="draw"]'), {
      strokeDasharray: 1,
      strokeDashoffset: 0,
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

    timeline.set(
      drawPaths,
      {
        strokeDasharray: 1,
        strokeDashoffset: 1,
      },
      0,
    );

    timeline.set([...fadePaths, ...glowPaths], { opacity: 0 }, 0);
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
      fadePaths,
      {
        opacity: 1,
        duration: 0.55,
        ease: "power1.out",
        stagger: 0.035,
      },
      0.08,
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
        opacity: 0.48,
        strokeWidth: 7.5,
        duration: 0.2,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.24,
    );

    timeline.to(
      secondaryGlowPaths,
      {
        opacity: 0.18,
        strokeWidth: 4.8,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.035,
      },
      0.42,
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
        opacity: 0.56,
        strokeWidth: 9,
        duration: 0.22,
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
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.04,
      },
      0.58,
    );

    timeline.to(
      nodes,
      {
        opacity: 1,
        scale: 1.18,
        duration: 0.18,
        ease: "power2.out",
        stagger: 0.025,
      },
      0.46,
    );

    timeline.to(
      nodes,
      {
        scale: 1,
        duration: 0.42,
        ease: "power2.out",
        stagger: 0.025,
      },
      0.64,
    );

    timeline.call(() => {
      runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
    }, undefined, 0.74);

    return timeline;
  };

  const setupActiveSvg = () => {
    killActiveMotion();

    // 브레이크포인트 기준으로 보이는 SVG 하나만 잡아서 중복 runner를 막음.
    const activeSvg = getActiveSvg(root, mobileMedia.matches);
    if (!activeSvg) return;

    const runnerTimelines = setupRunnerTimelines(activeSvg, { paused: true });

    if (hasRevealed) {
      setFinalActiveState(activeSvg);
      runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
      activeTimelines = runnerTimelines;
      return;
    }

    root.dataset.circuitActive = "false";

    // reveal은 한 번만 켜져야 장식처럼 반복되지 않아서 trigger와 분리함.
    const revealTimeline = createRevealTimeline(activeSvg, runnerTimelines);
    const revealTrigger = ScrollTrigger.create({
      trigger,
      start: "top 68%",
      once: true,
      onEnter: () => revealTimeline.play(0),
    });

    activeTimelines = [revealTimeline, ...runnerTimelines];
    activeTriggers = [revealTrigger];
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
