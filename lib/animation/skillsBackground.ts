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

// 현재 breakpoint에 표시할 desktop 또는 mobile 회로 SVG를 선택한다.
const selectActiveSvg = (root: HTMLElement, isMobile: boolean) =>
  root.querySelector<SVGSVGElement>(
    `[data-skills-bg-svg="${isMobile ? "mobile" : "desktop"}"]`,
  );

// 배경 parallax에 참여하는 레이어와 활성 SVG를 한 객체로 모은다.
const collectParallaxTargets = (
  root: HTMLElement,
  activeSvg: SVGSVGElement,
): ParallaxTargets => ({
  grid: root.querySelector<HTMLElement>('[data-parallax-layer="grid"]'),
  atmosphere: root.querySelector<HTMLElement>('[data-parallax-layer="atmosphere"]'),
  activeSvg,
});

// 선택 요소가 없는 레이어를 제외하고 GSAP에 전달할 대상만 반환한다.
const listParallaxElements = ({
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

// parallax가 요소에 남긴 transform과 성능 힌트 스타일을 제거한다.
const clearParallaxStyles = (
  gsap: GsapInstance,
  targets: ParallaxTargets | null,
) => {
  if (!targets) return;

  gsap.set(listParallaxElements(targets), {
    clearProps: "transform,willChange",
  });
};

// reveal, runner, parallax가 남긴 인라인 스타일을 한 번에 정리한다.
const clearMotionStyles = (
  gsap: GsapInstance,
  root: HTMLElement,
  trigger: HTMLElement,
  parallaxTargets: ParallaxTargets | null,
) => {
  clearRevealState(gsap, root, trigger);
  clearRunnerStyles(gsap, root);
  clearParallaxStyles(gsap, parallaxTargets);
};

// timeline에 속하지 않고 별도로 생성된 ScrollTrigger를 종료한다.
const killTriggers = (triggers: ScrollTriggerInstance[]) => {
  triggers.forEach((triggerInstance) => triggerInstance.kill());
};

// timeline과 timeline이 소유한 ScrollTrigger를 함께 종료한다.
const killMotionTimeline = (timeline: GsapTimeline) => {
  timeline.scrollTrigger?.kill();
  timeline.kill();
};

// 활성 SVG와 배경 레이어를 같은 진행률로 움직이는 parallax를 만든다.
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

  gsap.set(listParallaxElements(targets), { willChange: "transform" });

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

// 스킬 배경의 reveal, runner, parallax를 현재 모션 정책에 맞춰 초기화한다.
// 반환한 cleanup은 breakpoint listener와 활성 GSAP 자원을 모두 정리한다.
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

  // 현재 breakpoint가 소유한 trigger, timeline, 인라인 스타일을 초기화한다.
  const clearActiveMotion = () => {
    killTriggers(activeTriggers);
    activeTriggers = [];
    activeTimelines.forEach(killMotionTimeline);
    activeTimelines = [];
    clearMotionStyles(gsap, root, trigger, activeParallaxTargets);
    activeParallaxTargets = null;
  };

  // 이전 모션을 정리한 뒤 현재 breakpoint의 SVG를 기준으로 다시 구성한다.
  const buildActiveMotion = () => {
    clearActiveMotion();

    // 브레이크포인트 기준으로 보이는 SVG 하나만 잡아서 중복 runner를 막음.
    const activeSvg = selectActiveSvg(root, mobileMedia.matches);
    if (!activeSvg) return;

    // 이전 브레이크포인트의 parallax transform을 지우려고 active target을 저장함.
    activeParallaxTargets = collectParallaxTargets(root, activeSvg);

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

  // media query 경계가 바뀔 때만 활성 SVG와 모션을 다시 구성한다.
  const onBreakpointChange = () => {
    buildActiveMotion();
  };

  buildActiveMotion();
  mobileMedia.addEventListener("change", onBreakpointChange);

  return () => {
    mobileMedia.removeEventListener("change", onBreakpointChange);
    clearActiveMotion();
  };
};
