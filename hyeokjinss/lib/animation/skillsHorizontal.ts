import { loadGsap } from "@/lib/gsap/loadGsap";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";
import { motionDefaults } from "./runtime";

type SkillsHorizontalOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  track: HTMLElement;
  bgLayer?: HTMLElement | null;
  prefersReducedMotion: boolean;
};

export const initSkillsHorizontal = async ({
  root,
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

  // 초기 상태
  gsap.set(track, { x: 0, willChange: "transform" });

  // 1) ✅ “등장” 애니메이션 (pin 전 1회)
  const headingTargets = pinFrame.querySelectorAll<HTMLElement>("p, h2");
  const enterTl = gsap.timeline({ paused: true });

  // pinFrame 전체가 살짝 떠오르며 등장
  enterTl.fromTo(
    pinFrame,
    { autoAlpha: 0, y: prefersReducedMotion ? 10 : 18 },
    {
      autoAlpha: 1,
      y: 0,
      duration: prefersReducedMotion ? 0.25 : 0.55,
      ease: motionDefaults.ease,
      clearProps: "transform",
    },
    0,
  );

  // 제목들
  if (headingTargets.length) {
    enterTl.fromTo(
      headingTargets,
      { autoAlpha: 0, y: prefersReducedMotion ? 6 : 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.2 : 0.45,
        ease: motionDefaults.ease,
        stagger: prefersReducedMotion ? 0.02 : 0.06,
        clearProps: "transform",
      },
      prefersReducedMotion ? 0 : 0.06,
    );
  }

  // 트랙은 약하게(가로 방향 “시작점” 느낌)
  enterTl.fromTo(
    track,
    { autoAlpha: 0, x: prefersReducedMotion ? 0 : 16 },
    {
      autoAlpha: 1,
      x: 0,
      duration: prefersReducedMotion ? 0.2 : 0.5,
      ease: motionDefaults.ease,
      clearProps: "opacity",
      // x는 ScrollTrigger가 계속 쓰므로 clearProps: "transform" 금지
    },
    0.08,
  );

  // pin 배경은 약하게 페이드 인
  if (bgLayer) {
    enterTl.fromTo(
      bgLayer,
      { autoAlpha: 0 },
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
    onEnter: () => {
      enterTl.play(0);
    },
  });

  // 2) ✅ 기존 가로 스크롤 pin
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

  // 3) ✅ 배경도 우→좌로 약하게(핀 구간)
  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      x: -Math.min(60, profile.drift),
      // opacity: 0.92,
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
    enterTrigger.kill();
    enterTl.kill();

    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();

    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
