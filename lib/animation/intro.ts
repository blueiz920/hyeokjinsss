import { loadGsap } from "@/lib/gsap/loadGsap";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";

const roleStart = 0.46;
const nameStart = 0.64;
const supportStart = 1.5;

export const showIntro = (root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>("[data-intro-item]").forEach((item) => {
    item.style.opacity = "1";
  });
  root.querySelectorAll<HTMLElement>("[data-intro-char]").forEach((char) => {
    char.style.transform = "none";
    char.style.willChange = "auto";
  });
  root
    .querySelectorAll<HTMLElement>(".intro-context, .intro-proof-list")
    .forEach((item) => {
      item.style.clipPath = "none";
      item.style.transform = "none";
      item.style.willChange = "auto";
    });
};

// 로더가 끝난 뒤 Intro의 주요 블록을 순서대로 드러낸다.
export const initIntroAnimation = async (
  root: HTMLElement,
  prefersReducedMotion: boolean,
  onComplete: () => void = () => {},
) => {
  if (prefersReducedMotion) {
    onComplete();
    return () => {};
  }

  const { gsap, CustomEase } = await loadGsap();
  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");

  if (!items.length) {
    onComplete();
    return () => {};
  }

  const roleLines = root.querySelectorAll<HTMLElement>("[data-intro-role-line]");
  const nameChars = root.querySelectorAll<HTMLElement>(
    ".intro-name [data-intro-char]",
  );
  const context = root.querySelector<HTMLElement>(".intro-context");
  const proof = root.querySelector<HTMLElement>(".intro-proof-list");
  const entryEase = CustomEase.create(
    "intro-entry",
    "0.62, 0.05, 0.01, 0.99",
  );

  const timeline = gsap.timeline({ onComplete });

  roleLines.forEach((line) => {
    const chars = line.querySelectorAll<HTMLElement>("[data-intro-char]");
    if (!chars.length) return;

    timeline.fromTo(
      chars,
      { y: 0, yPercent: 80 },
      {
        y: 0,
        yPercent: 0,
        duration: 1.25,
        ease: entryEase,
        stagger: 0.06,
      },
      roleStart,
    );
  });

  if (nameChars.length) {
    timeline.fromTo(
      nameChars,
      { y: 0, yPercent: 80 },
      {
        y: 0,
        yPercent: 0,
        duration: 1.25,
        ease: entryEase,
        stagger: 0.06,
      },
      nameStart,
    );
  }

  [context, proof].forEach((item, index) => {
    if (!item) return;

    timeline.to(
      item,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: entryEase,
      },
      supportStart + index * 0.07,
    );
  });

  return () => {
    timeline.revert();
    timeline.kill();
  };
};

// Intro가 위로 벗어나는 동안 주요 블록을 함께 소멸시킨다.
export const initIntroScroll = async ({
  root,
  prefersReducedMotion,
}: {
  root: HTMLElement;
  prefersReducedMotion: boolean;
}) => {
  const { gsap } = await loadGsap();
  const profile = getMotionProfile(prefersReducedMotion);
  const scatterDistance = prefersReducedMotion
    ? "bottom top"
    : () => `+=${Math.round(window.innerHeight * 0.68)}`;

  const items = root.querySelectorAll<HTMLElement>("[data-intro-item]");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: scatterDistance,
      scrub: profile.scrub,
      invalidateOnRefresh: true,
    },
    defaults: { ease: "none" },
  });

  // 전체 intro 아이템은 점진적으로 사라짐
  if (items.length) {
    tl.to(
      items,
      {
        opacity: 0,
        y: prefersReducedMotion ? -profile.drift * 0.35 : -profile.drift * 0.55,
        duration: prefersReducedMotion ? 1 : 0.74,
      },
      0,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
