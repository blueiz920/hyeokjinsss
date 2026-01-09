import { loadGsap } from "@/lib/gsap/loadGsap";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

type SkillsHorizontalOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  track: HTMLElement;
  bgLayer?: HTMLElement | null;
  prefersReducedMotion: boolean;
};

export const initSkillsHorizontal = async ({
  pinFrame,
  track,
  bgLayer,
  prefersReducedMotion,
}: SkillsHorizontalOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  const profile = getMotionProfile(prefersReducedMotion);

  const getDistance = () => {
    const distance = track.scrollWidth - pinFrame.clientWidth;
    return Math.max(0, Math.round(distance));
  };

  const getEnd = () => {
    const distance = getDistance();
    const frameH = Math.max(1, Math.round(pinFrame.getBoundingClientRect().height));
    const cap = frameH * profile.capMultiplier;
    return Math.min(distance, cap);
  };

  gsap.set(track, { x: 0, willChange: "transform" });

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: pinFrame,
      start: "top top",
      end: () => `+=${getEnd()}`,
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onRefresh: () => gsap.set(track, { x: 0 }),
    },
  });

  // 배경도 우→좌로 약하게
  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      x: -Math.min(60, profile.drift),
      opacity: 0.12,
      ease: "none",
      scrollTrigger: {
        trigger: pinFrame,
        start: "top top",
        end: () => `+=${getEnd()}`,
        scrub: profile.scrub,
        invalidateOnRefresh: true,
      },
    });
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
