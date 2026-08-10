import { loadGsap } from "@/lib/gsap/loadGsap";

type ProjectCurveOptions = {
  section: HTMLElement;
  curve: HTMLElement;
};

// Projects가 viewport를 채우는 동안 Intro 색상의 곡면을 일직선으로 편다.
export const initProjectCurve = async ({
  section,
  curve,
}: ProjectCurveOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();

  gsap.set(curve, { willChange: "height" });

  const tween = gsap.to(curve, {
    height: 0,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "top top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(curve, { clearProps: "height,willChange" });
  };
};
