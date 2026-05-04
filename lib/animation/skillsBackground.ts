import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsBackgroundMotionOptions = {
  root: HTMLElement;
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
  prefersReducedMotion,
}: SkillsBackgroundMotionOptions) => {
  if (prefersReducedMotion || typeof window === "undefined") {
    return () => {};
  }

  const { gsap } = await loadGsap();
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let activeTimelines: Array<gsap.core.Timeline> = [];

  const clearRunnerStyles = () => {
    root
      .querySelectorAll<SVGGElement>("[data-runner-path]")
      .forEach((runner) => {
        gsap.set(runner, { clearProps: "all" });
      });
  };

  const killActiveMotion = () => {
    activeTimelines.forEach((timeline) => timeline.kill());
    activeTimelines = [];
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

    activeTimelines = runners.flatMap((runner) => {
      const timeline = createRunnerTimeline(activeSvg, runner, options);
      return timeline ? [timeline] : [];
    });
  };

  const setupActiveSvg = () => {
    killActiveMotion();

    // 브레이크포인트 기준으로 보이는 SVG 하나만 잡아서 중복 runner를 막음.
    const activeSvg = getActiveSvg(root, mobileMedia.matches);
    if (!activeSvg) return;

    setupRunnerTimelines(activeSvg);
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
