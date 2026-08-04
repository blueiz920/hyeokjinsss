import { loadGsap } from "@/lib/gsap/loadGsap";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";

type SkillsIntroOptions = {
  lockScroll: () => void;
  prefersReducedMotion: boolean;
  root: HTMLElement;
  unlockScroll: () => void;
};

const DESKTOP_QUERY = "(min-width: 1024px)";
const ARM_START = "top 92%";
const ENTRY_START = "top top";
const ENTRY_EASE = "power3.inOut";

// 섹션을 목적지로 진입할 때만 3.1초 장면을 재생하고 다른 이동은 통과시킨다.
export const initSkillsIntro = async ({
  lockScroll: lockRuntime,
  prefersReducedMotion,
  root,
  unlockScroll: unlockRuntime,
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
    ".skills-expertise-stage",
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
    root.dataset.skillPanelReady = "true";
    return () => {
      delete root.dataset.skillPanelReady;
    };
  }

  const { gsap, ScrollTrigger } = await loadGsap();
  const { Flip } = await import("gsap/dist/Flip");
  gsap.registerPlugin(Flip);
  const media = window.matchMedia(DESKTOP_QUERY);
  let refreshFrame = 0;
  let lockTimer = 0;
  let entryTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let layoutTween: ReturnType<typeof Flip.from> | null = null;
  let armTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
  let entryTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
  let canEnter = false;
  let hasPlayed = false;
  let isArmed = false;
  let ownsLock = false;
  let isRunning = false;

  const resetVisual = () => {
    gsap.set(visual, {
      clearProps:
        "opacity,visibility,position,top,left,width,height,xPercent,yPercent,x,y,scale,transform,transformOrigin,zIndex,clipPath,willChange",
    });
  };

  const clearProps = () => {
    gsap.set([title, ...titleLines, ...titleChars], {
      clearProps:
        "opacity,visibility,position,top,left,xPercent,yPercent,x,y,scale,transform,transformOrigin,zIndex,willChange",
    });
    resetVisual();
    gsap.set([eyebrow, description, photo], {
      clearProps:
        "opacity,visibility,x,y,scale,transform,transformOrigin,willChange",
    });
  };

  const unlockScroll = () => {
    if (lockTimer) {
      window.clearTimeout(lockTimer);
      lockTimer = 0;
    }
    if (!ownsLock) return;

    ownsLock = false;
    unlockRuntime();
    delete document.documentElement.dataset.skillsLocked;
  };

  const lockScroll = () => {
    if (ownsLock) return;

    ownsLock = true;
    lockRuntime();
    document.documentElement.dataset.skillsLocked = "true";
    lockTimer = window.setTimeout(unlockScroll, 3600);
  };

  const disarmMotion = () => {
    if (isRunning) return;

    isArmed = false;
    delete root.dataset.skillEntry;
    delete root.dataset.skillEntryMuted;
    clearProps();
  };

  const armMotion = () => {
    if (hasPlayed || isRunning || isArmed) return isArmed;

    const target = document.documentElement.dataset.sectionTarget;
    if ((target && target !== "skills") || (!canEnter && target !== "skills")) {
      return false;
    }

    isArmed = true;
    root.dataset.skillEntry = "armed";
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
      autoAlpha: 0,
      clipPath: "inset(100% 0% 0% 0%)",
      willChange: "clip-path,transform",
    });
    gsap.set(photo, {
      scale: 0.82,
      transformOrigin: "50% 50%",
      willChange: "transform",
    });
    return true;
  };

  const stageMotion = () => {
    const finalWidth = root.clientWidth / 2;
    const finalHeight = window.innerHeight;
    const visualScale = Math.min(
      0.4,
      288 / finalWidth,
      440 / finalHeight,
    );

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
    gsap.set(visual, {
      height: finalHeight * visualScale,
      left: "50%",
      position: "fixed",
      top: "50%",
      transformOrigin: "50% 50%",
      width: finalWidth * visualScale,
      xPercent: -50,
      yPercent: -50,
      zIndex: 1,
    });
  };

  const finishMotion = () => {
    isArmed = false;
    isRunning = false;
    resetVisual();
    root.dataset.skillPanelReady = "true";
    unlockScroll();
    delete root.dataset.skillEntryMuted;
    gsap.set(title, { clearProps: "zIndex" });
    gsap.set(titleChars, { clearProps: "transform,willChange" });
  };

  const buildTimeline = () =>
    gsap
      .timeline({ paused: true })
      .to(
        titleChars,
        {
          duration: 0.7,
          ease: ENTRY_EASE,
          stagger: 0.03,
          yPercent: 0,
        },
        0.2,
      )
      .add("split")
      .to(
        titleLines[0],
        { duration: 0.75, ease: ENTRY_EASE, x: "-16rem" },
        "split",
      )
      .to(
        titleLines[1],
        { duration: 0.75, ease: ENTRY_EASE, x: "16rem" },
        "split",
      )
      .set(visual, { autoAlpha: 1 }, "split")
      .to(
        visual,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.75,
          ease: ENTRY_EASE,
        },
        "split",
      )
      .to(photo, { duration: 0.75, ease: ENTRY_EASE, scale: 0.9 }, "split")
      .add("layout")
      .call(
        () => {
          const state = Flip.getState([title, ...titleLines]);
          root.dataset.skillEntry = "complete";
          gsap.set([title, ...titleLines], {
            clearProps:
              "opacity,visibility,position,top,left,xPercent,yPercent,x,y,scale,transform,transformOrigin,willChange",
          });
          layoutTween = Flip.from(state, {
            absolute: false,
            duration: 1,
            ease: ENTRY_EASE,
            nested: true,
            scale: true,
          });
        },
        [],
        "layout",
      )
      .set(visual, { zIndex: 3 }, "layout")
      .to(
        visual,
        {
          duration: 1,
          ease: ENTRY_EASE,
          height: () => window.innerHeight,
          left: 0,
          top: 0,
          width: () => root.clientWidth / 2,
          xPercent: 0,
          yPercent: 0,
        },
        "layout",
      )
      .to(photo, { duration: 1, ease: ENTRY_EASE, scale: 1 }, "layout")
      .to(
        eyebrow,
        { autoAlpha: 1, duration: 0.35, ease: "power3.out", y: 0 },
        "layout+=0.48",
      )
      .to(
        description,
        { autoAlpha: 1, duration: 0.35, ease: "power3.out", y: 0 },
        "layout+=0.58",
      )
      .call(finishMotion, [], "layout+=1");

  const startMotion = () => {
    if (hasPlayed || isRunning) return;
    if (!armMotion()) return;

    hasPlayed = true;
    isRunning = true;
    stageMotion();
    lockScroll();
    entryTimeline = buildTimeline();
    entryTimeline.play();
    armTrigger?.kill();
    entryTrigger?.kill();
    armTrigger = null;
    entryTrigger = null;
  };

  const handleIntent = (event: Event) => {
    if (!media.matches) return;

    const { id, phase } = (event as CustomEvent<SectionIntentDetail>).detail;
    if (phase === "start" && id !== "skills") {
      if (isRunning) {
        root.dataset.skillEntryMuted = "true";
        unlockScroll();
      } else if (isArmed) {
        disarmMotion();
      }
      return;
    }

    if (id !== "skills" || hasPlayed) return;

    const sectionTop = root.getBoundingClientRect().top;
    if (phase === "start" && Math.abs(sectionTop) <= window.innerHeight * 0.08) {
      canEnter = true;
      if (armMotion()) startMotion();
      return;
    }

    if (phase === "end") {
      canEnter = true;
      if (armMotion()) startMotion();
    }
  };

  const clearMotion = () => {
    if (refreshFrame) {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
    armTrigger?.kill();
    entryTrigger?.kill();
    entryTimeline?.kill();
    layoutTween?.kill();
    armTrigger = null;
    entryTrigger = null;
    entryTimeline = null;
    layoutTween = null;
    canEnter = false;
    hasPlayed = false;
    isArmed = false;
    isRunning = false;
    unlockScroll();
    delete root.dataset.skillEntry;
    delete root.dataset.skillEntryMuted;
    delete root.dataset.skillPanelReady;
    clearProps();
  };

  const createMotion = () => {
    clearMotion();
    if (!media.matches) return;

    canEnter = root.getBoundingClientRect().top > 0;
    if (!canEnter) root.dataset.skillPanelReady = "true";
    armTrigger = ScrollTrigger.create({
      onEnter: armMotion,
      onLeaveBack: () => {
        if (hasPlayed) return;
        canEnter = true;
        disarmMotion();
      },
      start: ARM_START,
      trigger: root,
    });
    entryTrigger = ScrollTrigger.create({
      onEnter: startMotion,
      onLeaveBack: () => {
        if (hasPlayed) return;
        canEnter = true;
        disarmMotion();
      },
      start: ENTRY_START,
      trigger: root,
    });

    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      ScrollTrigger.refresh();
    });
  };

  document.addEventListener(SECTION_INTENT_EVENT, handleIntent);
  media.addEventListener("change", createMotion);
  createMotion();

  return () => {
    document.removeEventListener(SECTION_INTENT_EVENT, handleIntent);
    media.removeEventListener("change", createMotion);
    clearMotion();
  };
};
