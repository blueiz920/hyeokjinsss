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

// ✅ 추가: 스크롤 기반 “점진 소멸 + 흩어짐”
export const initIntroScroll = async ({
  root,
  heading,
  bgLayer,
  prefersReducedMotion,
}: {
  root: HTMLElement;
  heading?: HTMLElement | null;
  bgLayer?: HTMLElement | null;
  prefersReducedMotion: boolean;
}) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  const profile = getMotionProfile(prefersReducedMotion);

  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");
  let split: ReturnType<typeof splitTextToChars> | null = null;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: "bottom top",
      scrub: profile.scrub,
      invalidateOnRefresh: true,
    },
    defaults: { ease: "none" },
  });

  // 전체 intro 아이템은 점진적으로 사라짐
  if (items.length) {
    tl.to(items, { opacity: 0, y: -profile.drift * 0.35 }, 0);
  }

  // 헤드라인만 예외적으로 문자 단위 흩어짐 (Reduced면 자동 비활성)
  if (!prefersReducedMotion && heading) {
    split = splitTextToChars(heading);
    const chars = split.chars;

    const scatter = chars.map(() => ({
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 50,
      r: (Math.random() - 0.5) * 12,
    }));

    tl.to(
      chars,
      {
        opacity: 0,
        filter: `blur(${profile.blurMax}px)`,
        x: (i: number) => scatter[i].x,
        y: (i: number) => scatter[i].y,
        rotate: (i: number) => scatter[i].r,
        stagger: { each: 0.008, from: "center" },
      },
      0,
    );
  }

  // 배경 레이어는 아주 약하게 위로
  if (bgLayer) {
    tl.to(bgLayer, { opacity: 0.06, y: -profile.drift }, 0);
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    split?.revert();
  };
};
