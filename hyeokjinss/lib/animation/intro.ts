import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";

export const initIntroAnimation = async (
  root: HTMLElement,
  prefersReducedMotion: boolean,
) => {
  const { gsap } = await loadGsap();
  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");

  if (!items.length) {
    return () => {};
  }

  const yDistance = prefersReducedMotion ? 12 : 28;

  const timeline = gsap.timeline();
  timeline.fromTo(
    items,
    { opacity: 0, y: yDistance },
    {
      opacity: 1,
      y: 0,
      duration: prefersReducedMotion ? 0.4 : motionDefaults.duration,
      ease: motionDefaults.ease,
      stagger: prefersReducedMotion ? 0.05 : 0.12,
    },
  );

  return () => {
    timeline.kill();
  };
};
