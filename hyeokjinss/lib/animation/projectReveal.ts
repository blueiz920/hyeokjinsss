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
  // root,
  pinFrame,
  stage,
  cards,
  prefersReducedMotion,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const distance = prefersReducedMotion ? 18 : 36;
  const steps = Math.max(1, cards.length - 1);

  gsap.set(cards, { autoAlpha: 0, y: distance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  const getFrameH = () => Math.max(1, pinFrame.getBoundingClientRect().height);

  const tl = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: 1 },
    scrollTrigger: {
      trigger: pinFrame, // ✅ 프레임 기준
      start: "top top",
      end: () => `+=${getFrameH() * steps}`, // ✅ viewport가 아닌 프레임 높이 기준
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: prefersReducedMotion
        ? { snapTo: "labelsDirectional", duration: 0.12, delay: 0, inertia: false }
        : { snapTo: "labelsDirectional", duration: 0.22, delay: 0.08, inertia: false },
    },
  });

  tl.addLabel("card0", 0);

  for (let i = 1; i < cards.length; i++) {
    tl.addLabel(`card${i}`, i);

    const prev = cards[i - 1];
    const cur = cards[i];

    tl.to(prev, { autoAlpha: 0, y: -distance }, i)
      .fromTo(cur, { autoAlpha: 0, y: distance }, { autoAlpha: 1, y: 0 }, i);
  }

  const handleRefresh = () => {
    gsap.set(stage, { height: "100%" });
  };

  ScrollTrigger.addEventListener("refreshInit", handleRefresh);
  handleRefresh();

  // 이미지/폰트 로딩 등으로 프레임 높이가 바뀌면 end 재계산 필요
  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 250);

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", handleRefresh);
    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
