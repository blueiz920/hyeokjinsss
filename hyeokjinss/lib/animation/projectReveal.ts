import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";

type ProjectRevealOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  stage: HTMLElement;
  cards: HTMLElement[];
  prefersReducedMotion: boolean;
};

export const initProjectReveal = async ({
  root,
  pinFrame,
  stage,
  cards,
  prefersReducedMotion,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const distance = prefersReducedMotion ? 18 : 36;

  // ✅ 겹침 전제: 초기 상태
  gsap.set(cards, { autoAlpha: 0, y: distance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  // 카드 3장이라면 steps=2 (전환 2번)
  const steps = Math.max(1, cards.length - 1);

  const tl = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: 1 },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => `+=${window.innerHeight * steps}`,
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      // ✅ 라벨 기반 스냅 (중간 스킵 방지)
      snap: prefersReducedMotion
        ? { snapTo: "labelsDirectional", duration: 0.12, delay: 0, inertia: false }
        : { snapTo: "labelsDirectional", duration: 0.22, delay: 0.08, inertia: false },
    },
  });

  // ✅ 라벨을 단계별로 명시
  tl.addLabel("card0", 0);

  for (let i = 1; i < cards.length; i++) {
    tl.addLabel(`card${i}`, i);

    const prev = cards[i - 1];
    const cur = cards[i];

    // ✅ 전환은 i 시점에서 시작: 0~1 구간은 card0 유지, 1~2 구간은 card1 유지 ...
    tl.to(prev, { autoAlpha: 0, y: -distance }, i)
      .fromTo(cur, { autoAlpha: 0, y: distance }, { autoAlpha: 1, y: 0 }, i);
  }

  const handleRefresh = () => {
    // stage는 pinFrame을 채우게
    gsap.set(stage, { height: "100%" });
  };

  ScrollTrigger.addEventListener("refreshInit", handleRefresh);
  handleRefresh();

  // 폰트/이미지 등 레이아웃 확정 후 재계산
  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 250);

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", handleRefresh);
    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
