import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsVisualOptions = {
  prefersReducedMotion: boolean;
  root: HTMLElement;
};

const DESKTOP_QUERY = "(min-width: 1024px)";
const SWAP_EASE = "cubic-bezier(0.45, 0.02, 0.09, 0.98)";

// 인트로가 지나간 뒤 사진과 기술 보드를 같은 sticky 좌표에서 교체한다.
export const initSkillsVisual = async ({
  prefersReducedMotion,
  root,
}: SkillsVisualOptions) => {
  if (typeof window === "undefined" || prefersReducedMotion) return () => {};

  const photo = root.querySelector<HTMLElement>("[data-skill-photo]");
  const board = root.querySelector<HTMLElement>("[data-skill-board]");
  const content = root.querySelector<HTMLElement>(".skills-expertise-content");
  if (!photo || !board || !content) return () => {};

  const { gsap, ScrollTrigger } = await loadGsap();
  const media = window.matchMedia(DESKTOP_QUERY);
  let refreshFrame = 0;
  let swapTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let swapTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;

  const clearMotion = () => {
    if (refreshFrame) {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
    swapTrigger?.kill();
    swapTimeline?.kill();
    swapTrigger = null;
    swapTimeline = null;
    gsap.set([photo, board], { clearProps: "opacity,visibility" });
  };

  const createMotion = () => {
    clearMotion();
    if (!media.matches) return;

    gsap.set(photo, { autoAlpha: 1 });
    gsap.set(board, { autoAlpha: 0 });

    swapTimeline = gsap
      .timeline({ paused: true })
      .to(
        photo,
        {
          autoAlpha: 0,
          duration: 0.25,
          ease: SWAP_EASE,
        },
        0,
      )
      .to(
        board,
        {
          autoAlpha: 1,
          duration: 0.25,
          ease: SWAP_EASE,
        },
        0,
      );

    swapTrigger = ScrollTrigger.create({
      trigger: content,
      start: "top -8%",
      end: "max",
      onEnter: () => swapTimeline?.play(),
      onLeaveBack: () => swapTimeline?.reverse(),
      onRefresh: (self) => {
        swapTimeline
          ?.progress(self.scroll() >= self.start ? 1 : 0)
          .pause();
      },
    });

    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      ScrollTrigger.refresh();
    });
  };

  media.addEventListener("change", createMotion);
  createMotion();

  return () => {
    media.removeEventListener("change", createMotion);
    clearMotion();
  };
};
