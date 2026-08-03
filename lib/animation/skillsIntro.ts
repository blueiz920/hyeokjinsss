import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsIntroOptions = {
  prefersReducedMotion: boolean;
  root: HTMLElement;
};

const DESKTOP_QUERY = "(min-width: 1024px)";
const ENTRY_START = "top 78%";
const ENTRY_END = "top 12%";
const SPLIT_START = "top top";
const SPLIT_END = "top -70%";

// 중앙 제목을 최종 우측 위치로 연결하면서 왼쪽 비주얼을 순차적으로 연다.
export const initSkillsIntro = async ({
  prefersReducedMotion,
  root,
}: SkillsIntroOptions) => {
  if (typeof window === "undefined" || prefersReducedMotion) return () => {};

  const title = root.querySelector<HTMLElement>(".skills-expertise-title");
  const eyebrow = root.querySelector<HTMLElement>(".skills-expertise-eyebrow");
  const description = root.querySelector<HTMLElement>(
    ".skills-expertise-description",
  );
  const visual = root.querySelector<HTMLElement>(
    ".skills-expertise-visual-inner",
  );
  const photo = root.querySelector<HTMLElement>(
    ".skills-expertise-photo img",
  );
  if (!title || !eyebrow || !description || !visual || !photo) return () => {};

  const { gsap, ScrollTrigger } = await loadGsap();
  const media = window.matchMedia(DESKTOP_QUERY);
  let refreshFrame = 0;
  let entryTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let splitTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let entryTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
  let splitTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;

  const clearMotion = () => {
    if (refreshFrame) {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
    entryTrigger?.kill();
    splitTrigger?.kill();
    entryTimeline?.kill();
    splitTimeline?.kill();
    entryTrigger = null;
    splitTrigger = null;
    entryTimeline = null;
    splitTimeline = null;
    delete root.dataset.skillEntry;
    gsap.set([title, eyebrow, description, visual, photo], {
      clearProps:
        "opacity,visibility,x,y,scale,transformOrigin,willChange,clipPath",
    });
  };

  const createMotion = () => {
    clearMotion();
    if (!media.matches) return;

    root.dataset.skillEntry = "active";
    gsap.set(title, {
      autoAlpha: 0,
      scale: 1.08,
      transformOrigin: "50% 50%",
      willChange: "transform,opacity",
      x: () => -root.clientWidth / 4,
      y: 28,
    });
    gsap.set([eyebrow, description], {
      autoAlpha: 0,
      willChange: "transform,opacity",
      y: 20,
    });
    gsap.set(visual, {
      clipPath: "inset(0% 0% 0% 100%)",
      willChange: "clip-path",
    });
    gsap.set(photo, {
      scale: 1.06,
      transformOrigin: "50% 50%",
      willChange: "transform",
    });

    entryTimeline = gsap
      .timeline({ paused: true })
      .to(title, { autoAlpha: 1, duration: 1, ease: "none", y: 0 });

    splitTimeline = gsap
      .timeline({ paused: true })
      .to(title, { duration: 1, ease: "none", scale: 1, x: 0 }, 0)
      .to(
        visual,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.82,
          ease: "none",
        },
        0.12,
      )
      .to(photo, { duration: 0.82, ease: "none", scale: 1 }, 0.12)
      .to(eyebrow, { autoAlpha: 1, duration: 0.3, ease: "none", y: 0 }, 0.62)
      .to(
        description,
        { autoAlpha: 1, duration: 0.3, ease: "none", y: 0 },
        0.7,
      );

    entryTrigger = ScrollTrigger.create({
      animation: entryTimeline,
      end: ENTRY_END,
      invalidateOnRefresh: true,
      scrub: 0.65,
      start: ENTRY_START,
      trigger: root,
    });
    splitTrigger = ScrollTrigger.create({
      animation: splitTimeline,
      end: SPLIT_END,
      invalidateOnRefresh: true,
      scrub: 0.65,
      start: SPLIT_START,
      trigger: root,
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
