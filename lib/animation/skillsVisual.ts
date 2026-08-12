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

  const pages = Array.from(
    root.querySelectorAll<HTMLElement>("[data-skill-deck-page]"),
  );
  const capabilities = Array.from(
    root.querySelectorAll<HTMLElement>("[data-skill-capability]"),
  );
  const activeNumber = root.querySelector<HTMLElement>(
    "[data-skill-active-number]",
  );
  const activeName = root.querySelector<HTMLElement>(
    "[data-skill-active-name]",
  );

  const { gsap, ScrollTrigger } = await loadGsap();
  const media = window.matchMedia(DESKTOP_QUERY);
  let refreshFrame = 0;
  let swapTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let swapTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
  let focusTriggers: Array<ReturnType<typeof ScrollTrigger.create>> = [];
  let activeIndex = -1;

  const clearFocus = () => {
    focusTriggers.forEach((trigger) => trigger.kill());
    focusTriggers = [];
    activeIndex = -1;
    pages.forEach((page) => delete page.dataset.active);
    capabilities.forEach((capability) => delete capability.dataset.active);
  };

  const setActive = (index: number) => {
    if (index === activeIndex || !pages[index] || !capabilities[index]) return;

    activeIndex = index;
    pages.forEach((page, pageIndex) => {
      page.dataset.active = pageIndex === index ? "true" : "false";
    });
    capabilities.forEach((capability, capabilityIndex) => {
      capability.dataset.active =
        capabilityIndex === index ? "true" : "false";
    });

    if (activeNumber) {
      activeNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
    }
    if (activeName) {
      activeName.textContent = pages[index].dataset.skillName ?? "";
    }
  };

  const syncActive = () => {
    if (!capabilities.length) return;

    const viewportCenter = window.innerHeight / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    capabilities.forEach((capability, index) => {
      const rect = capability.getBoundingClientRect();
      const capabilityCenter = rect.top + rect.height / 2;
      const distance = Math.abs(capabilityCenter - viewportCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActive(nearestIndex);
  };

  const clearMotion = () => {
    if (refreshFrame) {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
    swapTrigger?.kill();
    swapTimeline?.kill();
    clearFocus();
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

    if (pages.length === capabilities.length) {
      syncActive();
      focusTriggers = capabilities.map((capability, index) =>
        ScrollTrigger.create({
          trigger: capability,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActive(index),
          onEnterBack: () => setActive(index),
          onRefresh: syncActive,
        }),
      );
    }

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
