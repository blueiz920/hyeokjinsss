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
};

export const initProjectReveal = async ({
  pinFrame,
  stage,
  cards,
  bgLayer,
  prefersReducedMotion,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const profile = getMotionProfile(prefersReducedMotion);
  const distance = prefersReducedMotion ? 18 : 36;
  const steps = Math.max(1, cards.length - 1);
  const getFrameH = () => Math.max(1, pinFrame.getBoundingClientRect().height);
  const getEnd = () => `+=${getFrameH() * steps}`;

  gsap.set(cards, { autoAlpha: 0, y: distance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  const tl = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: 1 },
    scrollTrigger: {
      trigger: pinFrame,
      start: "top top",
      end: getEnd,
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: prefersReducedMotion
        ? { snapTo: "labelsDirectional", duration: 0.12, delay: 0, inertia: false }
        : { snapTo: "labelsDirectional", duration: 0.22, delay: 0.08, inertia: false },
    },
  });

  tl.addLabel("card0", 0);

  for (let i = 1; i < cards.length; i++) {
    tl.addLabel(`card${i}`, i);
    const prev = cards[i - 1];
    const cur = cards[i];

    tl.to(prev, { autoAlpha: 0, y: -distance }, i)
      .fromTo(cur, { autoAlpha: 0, y: distance }, { autoAlpha: 1, y: 0 }, i);
  }

  // 배경 패럴랙스(아주 약하게)
  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      y: -profile.drift,
      opacity: 0.10, // projects는 약하게
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
    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
