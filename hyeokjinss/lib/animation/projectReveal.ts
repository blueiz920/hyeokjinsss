import { loadGsap } from "@/lib/gsap/loadGsap";
import { getStepSnap, motionDefaults } from "./runtime";

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

  if (!cards.length) {
    return () => {};
  }

  const distance = prefersReducedMotion ? 18 : 36;
  const snap = getStepSnap(cards.length);

  gsap.set(cards, { opacity: 0, y: distance, position: "absolute", inset: 0 });
  gsap.set(cards[0], { opacity: 1, y: 0 });

  const timeline = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: prefersReducedMotion ? 0.3 : 0.6 },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: `+=${cards.length * 80}%`,
      scrub: prefersReducedMotion ? 0.2 : 0.6,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: prefersReducedMotion
        ? { snapTo: snap, duration: 0.1, delay: 0 }
        : { snapTo: snap, duration: 0.2, delay: 0.1 },
    },
  });

  cards.slice(1).forEach((card, index) => {
    const previous = cards[index];
    timeline
      .to(
        previous,
        {
          opacity: 0,
          y: -distance,
        },
        index,
      )
      .to(
        card,
        {
          opacity: 1,
          y: 0,
        },
        index,
      );
  });

  const handleRefresh = () => {
    gsap.set(stage, { minHeight: `${pinFrame.clientHeight}px` });
  };

  ScrollTrigger.addEventListener("refreshInit", handleRefresh);
  handleRefresh();

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", handleRefresh);
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
};
