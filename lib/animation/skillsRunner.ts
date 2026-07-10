import type { loadGsap } from "@/lib/gsap/loadGsap";

type RunnerTimelineOptions = {
  paused?: boolean;
};

type GsapRuntime = Awaited<ReturnType<typeof loadGsap>>;
type GsapInstance = GsapRuntime["gsap"];

const parseRunnerNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getRunnerPath = (svg: SVGSVGElement, pathKey: string) => {
  const paths = Array.from(
    svg.querySelectorAll<SVGPathElement>("[data-motion-path]"),
  );

  return paths.find((path) => path.dataset.motionPath === pathKey) ?? null;
};

const clampRunnerProgress = (value: number) => Math.max(0, Math.min(0.98, value));

const createRunnerTimeline = (
  gsap: GsapInstance,
  activeSvg: SVGSVGElement,
  runner: SVGGElement,
  { paused = false }: RunnerTimelineOptions = {},
) => {
  const pathKey = runner.dataset.runnerPath;
  if (!pathKey) return null;

  const path = getRunnerPath(activeSvg, pathKey);
  if (!path) return null;

  const duration = parseRunnerNumber(runner.dataset.runnerDuration, 12);
  const offset = parseRunnerNumber(runner.dataset.runnerOffset, 0);
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

export const createRunnerTimelines = (
  gsap: GsapInstance,
  activeSvg: SVGSVGElement,
  options?: RunnerTimelineOptions,
) => {
  const runners = Array.from(
    activeSvg.querySelectorAll<SVGGElement>("[data-runner-path]"),
  );

  return runners.flatMap((runner) => {
    const timeline = createRunnerTimeline(gsap, activeSvg, runner, options);
    return timeline ? [timeline] : [];
  });
};

export const clearRunnerStyles = (gsap: GsapInstance, root: HTMLElement) => {
  root.querySelectorAll<SVGGElement>("[data-runner-path]").forEach((runner) => {
    gsap.set(runner, { clearProps: "all" });
  });
};
