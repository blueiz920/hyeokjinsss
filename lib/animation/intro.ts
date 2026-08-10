import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

// 로더가 끝난 뒤 Intro의 주요 블록을 순서대로 드러낸다.
export const initIntroAnimation = async (
  root: HTMLElement,
  prefersReducedMotion: boolean,
  onComplete: () => void = () => {},
) => {
  const { gsap } = await loadGsap();
  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");

  if (!items.length) {
    onComplete();
    return () => {};
  }

  const yDistance = prefersReducedMotion ? 12 : 28;

  const timeline = gsap.timeline({ onComplete });
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

// Intro가 위로 벗어나는 동안 주요 블록을 함께 소멸시킨다.
export const initIntroScroll = async ({
  root,
  prefersReducedMotion,
}: {
  root: HTMLElement;
  prefersReducedMotion: boolean;
}) => {
  const { gsap } = await loadGsap();
  const profile = getMotionProfile(prefersReducedMotion);
  const scatterDistance = prefersReducedMotion
    ? "bottom top"
    : () => `+=${Math.round(window.innerHeight * 0.68)}`;

  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: scatterDistance,
      scrub: profile.scrub,
      invalidateOnRefresh: true,
    },
    defaults: { ease: "none" },
  });

  // 전체 intro 아이템은 점진적으로 사라짐
  if (items.length) {
    tl.to(
      items,
      {
        opacity: 0,
        y: prefersReducedMotion ? -profile.drift * 0.35 : -profile.drift * 0.55,
        duration: prefersReducedMotion ? 1 : 0.74,
      },
      0,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
