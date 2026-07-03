import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsBackgroundMotionOptions = {
  root: HTMLElement;
  trigger: HTMLElement;
  prefersReducedMotion: boolean;
};

type RunnerTimelineOptions = {
  paused?: boolean;
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

type RevealTargets = {
  cards: HTMLElement[];
  dotTrains: SVGElement[];
  drawPaths: SVGPathElement[];
  fadePaths: SVGPathElement[];
  glowPaths: SVGPathElement[];
  nodes: SVGElement[];
  primaryGlowPaths: SVGPathElement[];
  secondaryGlowPaths: SVGPathElement[];
};

type RevealTargetGroups = {
  atmosphericFadeGlowPaths: SVGPathElement[];
  fadeSharpPaths: SVGPathElement[];
  primaryDrawPaths: SVGPathElement[];
  secondaryDrawPaths: SVGPathElement[];
  secondaryFadeGlowPaths: SVGPathElement[];
};

type RevealTimelineOptions = {
  activeSvg: SVGSVGElement;
  gsap: GsapInstance;
  onComplete: () => void;
  root: HTMLElement;
  runnerTimelines: GsapTimeline[];
  trigger: HTMLElement;
};

type ParallaxTimelineOptions = {
  gsap: GsapInstance;
  isMobile: boolean;
  targets: ParallaxTargets;
  trigger: HTMLElement;
};

type RevealCompletionTargets = Pick<
  RevealTargets,
  "dotTrains" | "fadePaths" | "glowPaths" | "nodes"
>;

type RailDrawTargets = Pick<
  RevealTargetGroups,
  "primaryDrawPaths" | "secondaryDrawPaths"
>;

type GlowRevealTargets = Pick<
  RevealTargets,
  "primaryGlowPaths" | "secondaryGlowPaths"
>;

type NodeAndDotRevealTargets = Pick<RevealTargets, "dotTrains" | "nodes">;
type CardRevealTargets = Pick<RevealTargets, "cards">;

const MOBILE_QUERY = "(max-width: 767px)";

const parseRunnerNumber = (value: string | undefined, fallback: number) => {
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

const getRevealTargets = (
  activeSvg: SVGSVGElement,
  trigger: HTMLElement,
): RevealTargets => ({
  cards: getSkillCards(trigger),
  dotTrains: Array.from(activeSvg.querySelectorAll<SVGElement>(".skills-bg__dot-train")),
  drawPaths: Array.from(
    activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="draw"]'),
  ),
  fadePaths: Array.from(
    activeSvg.querySelectorAll<SVGPathElement>('[data-reveal-mode="fade"]'),
  ),
  glowPaths: Array.from(
    activeSvg.querySelectorAll<SVGPathElement>(".skills-bg__glow-lines [data-reveal-mode]"),
  ),
  nodes: Array.from(activeSvg.querySelectorAll<SVGElement>(".skills-bg__node")),
  primaryGlowPaths: Array.from(
    activeSvg.querySelectorAll<SVGPathElement>(
      '.skills-bg__glow-lines .skills-bg__path--primary[data-reveal-mode="draw"]',
    ),
  ),
  secondaryGlowPaths: Array.from(
    activeSvg.querySelectorAll<SVGPathElement>(
      '.skills-bg__glow-lines .skills-bg__path--secondary[data-reveal-mode="draw"]',
    ),
  ),
});

const splitRevealTargets = ({
  drawPaths,
  fadePaths,
}: RevealTargets): RevealTargetGroups => ({
  atmosphericFadeGlowPaths: fadePaths.filter(
    (path) =>
      path.closest(".skills-bg__glow-lines") &&
      path.classList.contains("skills-bg__path--atmospheric"),
  ),
  fadeSharpPaths: fadePaths.filter((path) => !path.closest(".skills-bg__glow-lines")),
  primaryDrawPaths: drawPaths.filter((path) =>
    path.classList.contains("skills-bg__path--primary"),
  ),
  secondaryDrawPaths: drawPaths.filter((path) =>
    path.classList.contains("skills-bg__path--secondary"),
  ),
  secondaryFadeGlowPaths: fadePaths.filter(
    (path) =>
      path.closest(".skills-bg__glow-lines") &&
      path.classList.contains("skills-bg__path--secondary"),
  ),
});

const clearRunnerStyles = (gsap: GsapInstance, root: HTMLElement) => {
  root.querySelectorAll<SVGGElement>("[data-runner-path]").forEach((runner) => {
    gsap.set(runner, { clearProps: "all" });
  });
};

const clearCardStyles = (gsap: GsapInstance, trigger: HTMLElement) => {
  gsap.set(getSkillCards(trigger), {
    clearProps:
      "--skill-card-ignite,--skill-card-scan,--skill-card-scan-scale",
  });
};

const clearRevealStyles = (gsap: GsapInstance, root: HTMLElement) => {
  root.querySelectorAll<SVGPathElement>("[data-reveal-mode]").forEach((path) => {
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

const clearParallaxStyles = (
  gsap: GsapInstance,
  targets: ParallaxTargets | null,
) => {
  if (!targets) return;

  gsap.set(getParallaxElements(targets), {
    clearProps: "transform,willChange",
  });
};

const clearRevealCompletionStyles = (
  gsap: GsapInstance,
  { dotTrains, fadePaths, glowPaths, nodes }: RevealCompletionTargets,
) => {
  gsap.set([...fadePaths, ...glowPaths, ...nodes, ...dotTrains], {
    clearProps: "opacity,strokeWidth,scale,transformOrigin",
  });
};

const clearActiveMotionStyles = (
  gsap: GsapInstance,
  root: HTMLElement,
  trigger: HTMLElement,
  parallaxTargets: ParallaxTargets | null,
) => {
  clearRevealStyles(gsap, root);
  clearCardStyles(gsap, trigger);
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
  const timeline = gsap.timeline({ paused, repeat: -1 }) as GsapTimeline;

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

const createRunnerTimelines = (
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

const applyActiveState = (
  gsap: GsapInstance,
  root: HTMLElement,
  trigger: HTMLElement,
  activeSvg: SVGSVGElement,
) => {
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

const setRevealStartState = (
  timeline: GsapTimeline,
  root: HTMLElement,
  { cards, dotTrains, drawPaths, fadePaths, glowPaths, nodes }: RevealTargets,
) => {
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
};

// 레일을 먼저 희미하게 띄우고 낮은 밝기로 안정시킨다.
const addFadingRails = (
  timeline: GsapTimeline,
  {
    atmosphericFadeGlowPaths,
    fadeSharpPaths,
    secondaryFadeGlowPaths,
  }: RevealTargetGroups,
) => {
  // fade 계열은 peak와 stable 차이를 줄여서 켜졌다 꺼지는 느낌을 막음.
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
};

// 선을 따라 그리며 글로우가 잠깐 튀게 한다.
const addDrawingRails = (
  timeline: GsapTimeline,
  { primaryDrawPaths, secondaryDrawPaths }: RailDrawTargets,
  { primaryGlowPaths, secondaryGlowPaths }: GlowRevealTargets,
) => {
  timeline.to(
    secondaryDrawPaths,
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
    primaryDrawPaths,
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
};

// 노드를 짧게 튕긴 뒤 점 흐름을 드러낸다.
const addNodeSparks = (
  timeline: GsapTimeline,
  { dotTrains, nodes }: NodeAndDotRevealTargets,
) => {
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
};

// 카드에 짧은 scan 리듬을 넣고 점등 상태로 넘긴다.
const addCardReveal = (
  timeline: GsapTimeline,
  { cards }: CardRevealTargets,
) => {
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
};

// reveal 중간에 runner 타임라인을 재생 예약한다.
const queueRunnerStart = (
  timeline: GsapTimeline,
  runnerTimelines: GsapTimeline[],
) => {
  timeline.call(() => {
    runnerTimelines.forEach((runnerTimeline) => runnerTimeline.play());
  }, undefined, 0.84);
};

const createRevealTimeline = ({
  activeSvg,
  gsap,
  onComplete,
  root,
  runnerTimelines,
  trigger,
}: RevealTimelineOptions) => {
  const targets = getRevealTargets(activeSvg, trigger);
  const groups = splitRevealTargets(targets);
  const timeline = gsap.timeline({
    paused: true,
    onComplete: () => {
      onComplete();
      applyActiveState(gsap, root, trigger, activeSvg);
      clearRevealCompletionStyles(gsap, targets);
    },
  }) as GsapTimeline;

  // 전체 점등 속도만 늦추려고 timeline 자체 속도를 조정함.
  timeline.timeScale(1 / REVEAL_TIME_SCALE);

  setRevealStartState(timeline, root, targets);
  addFadingRails(timeline, groups);
  addDrawingRails(timeline, groups, targets);
  addNodeSparks(timeline, targets);
  addCardReveal(timeline, targets);
  queueRunnerStart(timeline, runnerTimelines);

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
      runnerTimelines,
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
