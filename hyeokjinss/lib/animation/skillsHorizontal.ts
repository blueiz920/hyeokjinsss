import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";

type SkillsHorizontalOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  track: HTMLElement;
  prefersReducedMotion: boolean;
};

export const initSkillsHorizontal = async ({
  root,
  pinFrame,
  track,
  prefersReducedMotion,
}: SkillsHorizontalOptions) => {
  const { gsap } = await loadGsap();

  const getDistance = () =>
    Math.max(0, track.scrollWidth - pinFrame.clientWidth);

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => `+=${getDistance()}`,
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  gsap.set(track, { willChange: "transform" });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
