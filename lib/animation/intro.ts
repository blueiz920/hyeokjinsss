import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";
import { splitTextToChars } from "@/lib/motion/splitTextPolicy";

// ✅ 기존 함수 유지 (네 코드 그대로)
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
  const textureOverlay = root.querySelector<HTMLElement>("[data-intro-phrase-texture]");
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
    // phrase anchor의 class를 split 이후 글자 span으로 넘겨 정렬 기준을 유지함.
    split = splitTextToChars(heading, {
      inheritClassFromSelector: [
        {
          className: "intro-title-mask-char",
          selector: "[data-intro-mask-phrase-anchor]",
        },
      ],
    });
    const chars = split.chars;
    const maskChars = chars.filter((char) => char.classList.contains("intro-title-mask-char"));

    if (textureOverlay) {
      tl.to(
        textureOverlay,
        {
          opacity: 0,
          duration: 0.08,
        },
        0,
      );
    }

    if (maskChars.length) {
      tl.to(
        maskChars,
        {
          color: "rgba(255, 246, 229, 0.9)",
          duration: 0.22,
          textShadow:
            "0 0 10px rgba(245, 166, 70, 0.16), 0 10px 32px rgba(0, 0, 0, 0.58)",
          webkitTextStroke: "0.35px rgba(245, 166, 70, 0.22)",
        },
        0,
      );
    }

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
