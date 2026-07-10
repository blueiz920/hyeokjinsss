import { loadGsap } from "@/lib/gsap/loadGsap";
import {
  clearRunnerStyles,
  createRunnerTimelines,
} from "@/lib/animation/skillsRunner";
import {
  applyActiveState,
  applyReducedState,
  clearRevealState,
  createRevealTimeline,
} from "@/lib/animation/skillsReveal";

type SkillsBackgroundMotionOptions = {
  root: HTMLElement;
  trigger: HTMLElement;
  prefersReducedMotion: boolean;
};

type GsapRuntime = Awaited<ReturnType<typeof loadGsap>>;
type GsapInstance = GsapRuntime["gsap"];
type ScrollTriggerInstance = {
  kill: () => void;
};
type GsapTimeline = ReturnType<GsapInstance["timeline"]> & {
  scrollTrigger?: ScrollTriggerInstance;
};

type ParallaxTargets = {
  grid: HTMLElement | null;
  atmosphere: HTMLElement | null;
  activeSvg: SVGSVGElement;
};

type ParallaxTimelineOptions = {
  gsap: GsapInstance;
  isMobile: boolean;
  targets: ParallaxTargets;
  trigger: HTMLElement;
};

const MOBILE_QUERY = "(max-width: 767px)";

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

const GRID_PARALLAX_X = 8;
const ATMOSPHERE_PARALLAX_X = 24;
const DESKTOP_SVG_PARALLAX_X = 38;
const MOBILE_SVG_PARALLAX_X = 24;
const clearParallaxStyles = (
  gsap: GsapInstance,
  targets: ParallaxTargets | null,
) => {
  if (!targets) return;

  gsap.set(getParallaxElements(targets), {
    clearProps: "transform,willChange",
  });
};

const clearActiveMotionStyles = (
  gsap: GsapInstance,
  root: HTMLElement,
  trigger: HTMLElement,
  parallaxTargets: ParallaxTargets | null,
) => {
  clearRevealState(gsap, root, trigger);
  clearRunnerStyles(gsap, root);
  clearParallaxStyles(gsap, parallaxTargets);
};

const killScrollTriggers = (triggers: ScrollTriggerInstance[]) => {
  triggers.forEach((triggerInstance) => triggerInstance.kill());
};

const killTimeline = (timeline: GsapTimeline) => {
  timeline.scrollTrigger?.kill();
  timeline.kill();
};

const createParallaxTimeline = ({
  gsap,
  isMobile,
  targets,
  trigger,
}: ParallaxTimelineOptions) => {
  const { grid, atmosphere, activeSvg } = targets;
  const svgDistance = isMobile
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
  }) as GsapTimeline;

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

export const initSkillsBackgroundMotion = async ({
  root,
  trigger,
  prefersReducedMotion,
}: SkillsBackgroundMotionOptions) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (prefersReducedMotion) {
    return applyReducedState(root, trigger);
  }

  const { gsap, ScrollTrigger } = await loadGsap();
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let activeTimelines: GsapTimeline[] = [];
  // timeline에 묶이지 않은 trigger만 따로 보관해서 중복 cleanup을 피함.
  let activeTriggers: ScrollTriggerInstance[] = [];
  let activeParallaxTargets: ParallaxTargets | null = null;
  let hasRevealed = false;

  const killActiveMotion = () => {
    killScrollTriggers(activeTriggers);
    activeTriggers = [];
    activeTimelines.forEach(killTimeline);
    activeTimelines = [];
    clearActiveMotionStyles(gsap, root, trigger, activeParallaxTargets);
    activeParallaxTargets = null;
  };

  const setupActiveSvg = () => {
    killActiveMotion();

    // 브레이크포인트 기준으로 보이는 SVG 하나만 잡아서 중복 runner를 막음.
    const activeSvg = getActiveSvg(root, mobileMedia.matches);
    if (!activeSvg) return;

    // 이전 브레이크포인트의 parallax transform을 지우려고 active target을 저장함.
    activeParallaxTargets = getParallaxTargets(root, activeSvg);

    const runnerTimelines = createRunnerTimelines(gsap, activeSvg, {
      paused: true,
    });
    // parallax는 ScrollTrigger 하나에 묶어서 중복 trigger 생성을 막음.
    const parallaxTimeline = createParallaxTimeline({
      gsap,
      isMobile: mobileMedia.matches,
      targets: activeParallaxTargets,
      trigger,
    });

    if (hasRevealed) {
      applyActiveState(gsap, root, trigger, activeSvg);
      runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
      activeTimelines = [...runnerTimelines, parallaxTimeline];
      activeTriggers = [];
      return;
    }

    root.dataset.circuitActive = "false";

    // reveal은 한 번만 켜져야 장식처럼 반복되지 않아서 trigger와 분리함.
    const revealTimeline = createRevealTimeline({
      activeSvg,
      gsap,
      onComplete: () => {
        hasRevealed = true;
      },
      root,
      onRunnerStart: () => {
        runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
      },
      trigger,
    });
    const revealTrigger = ScrollTrigger.create({
      trigger,
      start: "top 38%",
      once: true,
      onEnter: () => revealTimeline.play(0),
    });

    activeTimelines = [revealTimeline, ...runnerTimelines, parallaxTimeline];
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
