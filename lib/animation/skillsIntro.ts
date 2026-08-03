import { loadGsap } from "@/lib/gsap/loadGsap";

type SkillsIntroOptions = {
  prefersReducedMotion: boolean;
  root: HTMLElement;
};

const DESKTOP_QUERY = "(min-width: 1024px)";
const ENTRY_START = "top 5%";
const ENTRY_EASE = "power3.inOut";

// 섹션 진입을 시작 신호로 삼고 제목과 사진을 시간 기반 장면으로 펼친다.
export const initSkillsIntro = async ({
  prefersReducedMotion,
  root,
}: SkillsIntroOptions) => {
  if (typeof window === "undefined" || prefersReducedMotion) return () => {};

  const title = root.querySelector<HTMLElement>(".skills-expertise-title");
  const titleLines = Array.from(
    root.querySelectorAll<HTMLElement>("[data-skill-title-line]"),
  );
  const titleChars = Array.from(
    root.querySelectorAll<HTMLElement>("[data-skill-title-char]"),
  );
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
  if (
    !title ||
    titleLines.length !== 2 ||
    titleChars.length === 0 ||
    !eyebrow ||
    !description ||
    !visual ||
    !photo
  ) {
    return () => {};
  }

  const { gsap, ScrollTrigger } = await loadGsap();
  const { Flip } = await import("gsap/dist/Flip");
  gsap.registerPlugin(Flip);
  const media = window.matchMedia(DESKTOP_QUERY);
  let refreshFrame = 0;
  let entryTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let entryTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
  let layoutTween: ReturnType<typeof Flip.from> | null = null;
  let isComplete = false;

  const clearProps = () => {
    gsap.set([title, ...titleLines, ...titleChars], {
      clearProps:
        "opacity,visibility,position,top,left,xPercent,yPercent,x,y,scale,transform,transformOrigin,zIndex,willChange",
    });
    gsap.set(visual, {
      clearProps:
        "position,top,left,width,height,xPercent,yPercent,x,y,scale,transform,transformOrigin,zIndex,clipPath,willChange",
    });
    gsap.set([eyebrow, description, photo], {
      clearProps:
        "opacity,visibility,x,y,scale,transform,transformOrigin,willChange",
    });
  };

  const setFinal = () => {
    isComplete = true;
    root.dataset.skillEntry = "complete";
    clearProps();
  };

  const clearMotion = () => {
    if (refreshFrame) {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
    entryTrigger?.kill();
    entryTimeline?.kill();
    layoutTween?.kill();
    entryTrigger = null;
    entryTimeline = null;
    layoutTween = null;
    isComplete = false;
    delete root.dataset.skillEntry;
    clearProps();
  };

  const createMotion = () => {
    clearMotion();
    if (!media.matches) return;

    root.dataset.skillEntry = "staged";
    gsap.set(title, {
      autoAlpha: 1,
      left: "50%",
      position: "fixed",
      scale: 0.72,
      top: "50%",
      transformOrigin: "50% 50%",
      willChange: "transform",
      xPercent: -50,
      yPercent: -50,
      zIndex: 2,
    });
    gsap.set(titleChars, {
      yPercent: 120,
      willChange: "transform",
    });
    gsap.set([eyebrow, description], {
      autoAlpha: 0,
      willChange: "transform,opacity",
      y: 20,
    });
    gsap.set(visual, {
      clipPath: "inset(50% 50% 50% 50%)",
      height: () => Math.min(window.innerHeight * 0.54, 440),
      left: "50%",
      position: "fixed",
      top: "50%",
      transformOrigin: "50% 50%",
      width: () => Math.min(root.clientWidth * 0.2, 288),
      willChange: "clip-path,transform",
      xPercent: -50,
      yPercent: -50,
      zIndex: 1,
    });
    gsap.set(photo, {
      scale: 0.82,
      transformOrigin: "50% 50%",
      willChange: "transform",
    });

    entryTimeline = gsap
      .timeline({ paused: true })
      .to(
        titleChars,
        {
          duration: 1,
          ease: ENTRY_EASE,
          stagger: 0.05,
          yPercent: 0,
        },
        0.3,
      )
      .add("split")
      .to(
        titleLines[0],
        { duration: 1, ease: ENTRY_EASE, x: "-16rem" },
        "split",
      )
      .to(
        titleLines[1],
        { duration: 1, ease: ENTRY_EASE, x: "16rem" },
        "split",
      )
      .to(
        visual,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1,
          ease: ENTRY_EASE,
        },
        "split",
      )
      .to(photo, { duration: 1, ease: ENTRY_EASE, scale: 0.9 }, "split")
      .add("layout")
      .call(
        () => {
          const state = Flip.getState([title, ...titleLines, visual]);
          root.dataset.skillEntry = "complete";
          gsap.set([title, ...titleLines, visual], {
            clearProps:
              "position,top,left,width,height,xPercent,yPercent,x,y,scale,transform,transformOrigin,zIndex,clipPath,willChange",
          });
          layoutTween = Flip.from(state, {
            absolute: true,
            duration: 1,
            ease: ENTRY_EASE,
            nested: true,
            scale: true,
          });
        },
        [],
        "layout",
      )
      .to(photo, { duration: 1, ease: ENTRY_EASE, scale: 1 }, "layout")
      .to(
        eyebrow,
        { autoAlpha: 1, duration: 0.45, ease: "power3.out", y: 0 },
        "layout+=0.5",
      )
      .to(
        description,
        { autoAlpha: 1, duration: 0.45, ease: "power3.out", y: 0 },
        "layout+=0.6",
      )
      .call(
        () => {
          isComplete = true;
          gsap.set(titleChars, { clearProps: "transform,willChange" });
        },
        [],
        "layout+=1",
      );

    entryTrigger = ScrollTrigger.create({
      invalidateOnRefresh: true,
      once: true,
      onEnter: () => entryTimeline?.play(),
      onRefresh: (self) => {
        if (!isComplete && self.scroll() > self.start + 1) {
          entryTimeline?.kill();
          layoutTween?.kill();
          entryTimeline = null;
          layoutTween = null;
          setFinal();
        }
      },
      start: ENTRY_START,
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
