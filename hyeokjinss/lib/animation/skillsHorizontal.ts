import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsHorizontalOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  track: HTMLElement;
  prefersReducedMotion: boolean;
};

export const initSkillsHorizontal = async ({
  // root,
  pinFrame,
  track,
  prefersReducedMotion,
}: SkillsHorizontalOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();

  // ✅ 실제 가로 이동 거리
  const getDistance = () => {
    // scrollWidth는 “컨텐츠 전체 폭”
    const distance = track.scrollWidth - pinFrame.clientWidth;
    return Math.max(0, Math.round(distance));
  };

  // ✅ pin 구간 상한: 프레임 높이 기준으로 제한 (기기별 UX 차이 제거)
  const getEnd = () => {
    const distance = getDistance();
    const frameH = Math.max(1, Math.round(pinFrame.getBoundingClientRect().height));
    // 예: 프레임 높이의 최대 3배까지만 세로 스크롤을 소모
    const cap = frameH * 3;
    return Math.min(distance, cap);
  };

  // 초기 x 리셋 (리프레시 시 누적 방지)
  gsap.set(track, { x: 0, willChange: "transform" });

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: pinFrame,            // ✅ root가 아니라 프레임 기준이 안정적
      start: "top top",
      end: () => `+=${getEnd()}`,    // ✅ 상한 적용
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,

      // ✅ 스크롤이 끝났을 때 track이 정확히 제 위치로 가도록(잔상/튐 방지)
      onRefresh: () => {
        gsap.set(track, { x: 0 });
      },
    },
  });

  // ✅ 레이아웃 확정 후 한번 더 갱신 (이미지/폰트/컨테이너 폭 변동 대비)
  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
