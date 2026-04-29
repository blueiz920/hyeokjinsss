import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";
import { splitTextToChars } from "@/lib/motion/splitTextPolicy";

// ✅ 기존 함수 유지 (네 코드 그대로)
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

// 스크롤 기반 소멸 + 흩어짐
export const initIntroScroll = async ({
  root,
  heading,
  prefersReducedMotion,
}: {
  root: HTMLElement;
  heading?: HTMLElement | null;
  prefersReducedMotion: boolean;
}) => {
  const { gsap } = await loadGsap();
  const profile = getMotionProfile(prefersReducedMotion);
  const scatterDistance = prefersReducedMotion
    ? "bottom top"
    : () => `+=${Math.round(window.innerHeight * 0.68)}`;

  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");
  let split: ReturnType<typeof splitTextToChars> | null = null;

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

  // 헤드라인만 예외적으로 문자 단위 흩어짐
  if (!prefersReducedMotion && heading) {
    split = splitTextToChars(heading);
    const chars = split.chars;

    // 초반 스크롤에 바로 반응하도록 이동량과 회전을 키움.
    const scatter = chars.map(() => ({
      x: (Math.random() - 0.5) * 360,
      y: 40 - Math.random() * 220,
      r: (Math.random() - 0.5) * 220,
    }));

    tl.to(
      chars,
      {
        opacity: 0,
        filter: `blur(${Math.min(14, profile.blurMax * 1.45)}px)`,
        x: (i: number) => scatter[i].x,
        y: (i: number) => scatter[i].y,
        rotate: (i: number) => scatter[i].r,
        duration: 0.72,
        stagger: { each: 0.004, from: "center" },
      },
      0,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    split?.revert();
  };
};
