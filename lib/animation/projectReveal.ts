import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

type ProjectRevealOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  stage: HTMLElement;
  cards: HTMLElement[];
  bgLayer?: HTMLElement | null;
  prefersReducedMotion: boolean;
  onActiveChange?: (active: boolean) => void;
  onStepChange?: (step: number) => void;
};

export const initProjectReveal = async ({
  root,
  pinFrame,
  stage,
  cards,
  bgLayer,
  prefersReducedMotion,
  onActiveChange,
  onStepChange,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const profile = getMotionProfile(prefersReducedMotion);

  const distance = prefersReducedMotion ? 12 : 26;
  const cardDistance = prefersReducedMotion ? 18 : 36;
  const maxStep = Math.max(0, cards.length - 1);
  const endSteps = Math.max(1, maxStep);

  const getFrameH = () => Math.max(1, pinFrame.getBoundingClientRect().height);
  const getEnd = () => `+=${getFrameH() * endSteps}`;

  gsap.set(cards, { autoAlpha: 0, y: cardDistance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  const headingTargets = pinFrame.querySelectorAll<HTMLElement>("p, h2");
  const enterTl = gsap.timeline({ paused: true });

  enterTl.fromTo(
    pinFrame,
    { autoAlpha: 0, y: distance },
    {
      autoAlpha: 1,
      y: 0,
      duration: prefersReducedMotion ? 0.55 : 2.55,
      ease: motionDefaults.ease,
      clearProps: "transform",
    },
    0,
  );

  if (headingTargets.length) {
    enterTl.fromTo(
      headingTargets,
      { autoAlpha: 0, y: prefersReducedMotion ? 6 : 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.2 : 1.45,
        ease: motionDefaults.ease,
        stagger: prefersReducedMotion ? 0.02 : 0.06,
        clearProps: "transform",
      },
      prefersReducedMotion ? 0 : 0.06,
    );
  }

  enterTl.fromTo(
    cards[0],
    { y: prefersReducedMotion ? 10 : 18, autoAlpha: 1 },
    {
      y: 0,
      duration: prefersReducedMotion ? 0.25 : 1.55,
      ease: motionDefaults.ease,
      clearProps: "transform",
    },
    0.08,
  );

  if (bgLayer) {
    enterTl.fromTo(
      bgLayer,
      { autoAlpha: 0, y: 0 },
      {
        autoAlpha: 1,
        duration: prefersReducedMotion ? 0.2 : 0.45,
        ease: "none",
      },
      0,
    );
  }

  const enterTrigger = ScrollTrigger.create({
    trigger: pinFrame,
    start: "top 85%",
    once: true,
    onEnter: () => enterTl.play(0),
  });

  const TRANS = prefersReducedMotion ? 0.45 : 0.78;
  const START_EPS = prefersReducedMotion ? 0.03 : 0.02;
  const ACTIVE_START = "top 30%";
  const ACTIVE_END = "bottom 50%";

  let emittedStep = -1;
  const emitStep = (step: number) => {
    const next = Math.max(0, Math.min(step, maxStep));
    if (next === emittedStep) return;
    emittedStep = next;
    onStepChange?.(next);
  };

  const deriveStep = (t: number) => {
    for (let i = maxStep; i >= 1; i--) {
      if (t >= i - TRANS + START_EPS) return i;
    }
    return 0;
  };

  const tl = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: TRANS },
    scrollTrigger: {
      trigger: pinFrame,
      start: "top top",
      end: getEnd,
      scrub: prefersReducedMotion ? 0.2 : 0.22,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: prefersReducedMotion
        ? { snapTo: "labelsDirectional", duration: 0.22, delay: 0, inertia: false }
        : { snapTo: "labelsDirectional", duration: 0.17, delay: 0.02, inertia: false },
      onUpdate: () => {
        emitStep(deriveStep(tl.time()));
      },
    },
  });

  tl.addLabel("card0", 0);

  for (let i = 1; i < cards.length; i++) {
    tl.addLabel(`card${i}`, i);

    const prev = cards[i - 1];
    const cur = cards[i];
    const startAt = i - TRANS;

    tl.to(prev, { autoAlpha: 0, y: -cardDistance }, startAt).fromTo(
      cur,
      { autoAlpha: 0, y: cardDistance },
      { autoAlpha: 1, y: 0 },
      startAt,
    );
  }

  const indicatorTrigger = ScrollTrigger.create({
    trigger: root,
    start: ACTIVE_START,
    end: ACTIVE_END,
    onEnter: () => {
      onActiveChange?.(true);
      emitStep(deriveStep(tl.time()));
    },
    onEnterBack: () => {
      onActiveChange?.(true);
      emitStep(deriveStep(tl.time()));
    },
    onLeave: () => onActiveChange?.(false),
    onLeaveBack: () => onActiveChange?.(false),
  });

  emitStep(0);

  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      y: -profile.drift,
      ease: "none",
      scrollTrigger: {
        trigger: pinFrame,
        start: "top top",
        end: getEnd,
        scrub: profile.scrub,
        invalidateOnRefresh: true,
      },
    });
  }

  const handleRefresh = () => {
    gsap.set(stage, { height: "100%" });
  };

  ScrollTrigger.addEventListener("refreshInit", handleRefresh);
  handleRefresh();

  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 250);

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", handleRefresh);

    indicatorTrigger.kill();
    enterTrigger.kill();
    enterTl.kill();

    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();

    tl.scrollTrigger?.kill();
    tl.kill();

    onActiveChange?.(false);
  };
};
