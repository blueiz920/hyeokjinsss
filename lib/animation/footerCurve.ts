import { loadGsap } from "@/lib/gsap/loadGsap";

type FooterCurveOptions = {
  footer: HTMLElement;
  curve: HTMLElement;
};

// 푸터 진입률에 맞춰 타원 클리핑 높이를 줄여 곡면을 평평하게 만든다.
export const initFooterCurve = async ({
  footer,
  curve,
}: FooterCurveOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();

  gsap.set(curve, { willChange: "height" });

  const tween = gsap.to(curve, {
    height: 0,
    ease: "none",
    scrollTrigger: {
      trigger: footer,
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
