import { loadGsap } from "@/lib/gsap/loadGsap";

const INTRO_READY_EVENT = "portfolio:intro-ready";

type IntroLoaderOptions = {
  root: HTMLElement;
  onReveal: () => void;
  onComplete: () => void;
};

export const markIntroReady = () => {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.introReady = "true";
  document.dispatchEvent(new Event(INTRO_READY_EVENT));
};

export const waitIntroReady = (onReady: () => void) => {
  if (typeof document === "undefined") return () => {};

  if (document.documentElement.dataset.introReady === "true") {
    onReady();
    return () => {};
  }

  const handleReady = () => onReady();
  document.addEventListener(INTRO_READY_EVENT, handleReady, { once: true });

  return () => document.removeEventListener(INTRO_READY_EVENT, handleReady);
};

export const initIntroLoader = async ({
  root,
  onReveal,
  onComplete,
}: IntroLoaderOptions) => {
  const { gsap } = await loadGsap();
  const screen = root.querySelector<HTMLElement>("[data-loader-screen]");
  const curve = root.querySelector<HTMLElement>("[data-loader-curve]");
  const wordGroup = root.querySelector<HTMLElement>("[data-loader-words]");
  const words = root.querySelectorAll<HTMLElement>("[data-loader-word]");

  if (!screen || !curve || !wordGroup || !words.length) {
    onReveal();
    onComplete();
    return () => {};
  }

  gsap.set(words, { autoAlpha: 0, y: 16 });

  const timeline = gsap.timeline({ onComplete });
  const wordStep = 0.32;

  words.forEach((word, index) => {
    const start = 0.4 + index * wordStep;
    const isLast = index === words.length - 1;

    timeline.to(
      word,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      },
      start,
    );

    if (!isLast) {
      timeline.to(
        word,
        {
          autoAlpha: 0,
          y: -14,
          duration: 0.16,
          ease: "power2.in",
        },
        start + 0.24,
      );
    }
  });

  const exitStart = 1.52;

  timeline
    .call(onReveal, [], exitStart)
    .to(
      wordGroup,
      {
        opacity: 0,
        duration: 0.24,
        ease: "power2.in",
      },
      exitStart,
    )
    .to(
      screen,
      {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
      },
      exitStart,
    )
    .to(
      curve,
      {
        height: 0,
        duration: 1,
        ease: "power4.inOut",
      },
      exitStart,
    );

  return () => timeline.kill();
};
