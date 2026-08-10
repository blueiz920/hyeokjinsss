"use client";

import { useCallback, useEffect, useRef } from "react";
import { portfolio } from "@/data/portfolio";
import {
  initIntroAnimation,
  initIntroScroll,
  showIntro,
} from "@/lib/animation/intro";
import { waitIntroReady } from "@/lib/animation/introLoader";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { IntroPull } from "./IntroPull";

// 정상 sequence(약 2.6초)는 유지하고 cold import 실패 경계만 여유 있게 둔다.
const INTRO_ENTRY_FALLBACK_MS = 4000;

const IntroChars = ({ text }: { text: string }) => (
  <>
    {Array.from(text).map((character, index) => (
      <span className="intro-char-cell" key={`${character}-${index}`}>
        <span className="intro-char" data-intro-char>
          {character === " " ? "\u00a0" : character}
        </span>
      </span>
    ))}
  </>
);

export const Intro = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { prefersReducedMotion, unlockScroll } = useScrollRuntime();
  const { register, unregister, scrollTo } = useSectionRegistry();
  const showProjects = useCallback(() => scrollTo("projects"), [scrollTo]);

  useEffect(() => {
    if (!sectionRef.current) return;

    register("intro", sectionRef);
    return () => unregister("intro");
  }, [register, unregister]);

  // 로더 이후 진입 장면을 마친 뒤 스크롤 소멸을 연결해 같은 속성의 경합을 막는다.
  useEffect(() => {
    if (!sectionRef.current) return;

    const root = sectionRef.current;
    let alive = true;
    let introDestroy: (() => void) | null = null;
    let scrollDestroy: (() => void) | null = null;
    let entryTimer = 0;
    let isEntering = false;
    let isLeaving = false;
    let ownsLock = false;
    let scrollStarted = false;
    let hasFinished = false;

    const releaseIntro = () => {
      if (entryTimer) {
        window.clearTimeout(entryTimer);
        entryTimer = 0;
      }
      delete document.documentElement.dataset.introEntering;
      if (!ownsLock) return;

      ownsLock = false;
      delete document.documentElement.dataset.introLocked;
      unlockScroll();
    };

    const startScroll = () => {
      if (!alive || scrollStarted) return;

      scrollStarted = true;
      void (async () => {
        try {
          const dispose = await initIntroScroll({
            root,
            prefersReducedMotion,
          });
          if (!alive) {
            dispose();
            return;
          }
          scrollDestroy = dispose;
        } catch (error) {
          if (alive) console.error("Intro scroll motion failed.", error);
        }
      })();
    };

    const finishIntro = (cancelEntry = false) => {
      if (hasFinished) return;

      hasFinished = true;
      isEntering = false;
      if (cancelEntry) {
        introDestroy?.();
        introDestroy = null;
      }
      showIntro(root);
      if (!isLeaving) delete root.dataset.introEntryMuted;
      releaseIntro();
      startScroll();
    };

    const startIntro = () => {
      isEntering = true;
      if (!prefersReducedMotion) {
        ownsLock =
          document.documentElement.dataset.introLocked === "true";
        document.documentElement.dataset.introEntering = "true";
        entryTimer = window.setTimeout(
          () => finishIntro(true),
          INTRO_ENTRY_FALLBACK_MS,
        );
      }
      void (async () => {
        try {
          const dispose = await initIntroAnimation(
            root,
            prefersReducedMotion,
            finishIntro,
          );
          if (!alive || !isEntering) {
            dispose();
            showIntro(root);
            return;
          }
          introDestroy = dispose;
        } catch (error) {
          if (!alive) return;
          console.error("Intro entry motion failed.", error);
          finishIntro();
        }
      })();
    };

    const handleIntent = (event: Event) => {
      const { id, phase } = (event as CustomEvent<SectionIntentDetail>).detail;

      if (phase === "end" && id !== "intro" && isLeaving) {
        isLeaving = false;
        delete root.dataset.introEntryMuted;
        return;
      }

      if (phase === "start" && id === "intro") {
        isLeaving = false;
        delete root.dataset.introEntryMuted;
        return;
      }

      if (id === "intro" || !isEntering) return;

      if (phase === "start") {
        isLeaving = true;
        root.dataset.introEntryMuted = "true";
        releaseIntro();
      }
    };

    document.addEventListener(SECTION_INTENT_EVENT, handleIntent);
    const stopWaiting = waitIntroReady(startIntro);

    return () => {
      alive = false;
      document.removeEventListener(SECTION_INTENT_EVENT, handleIntent);
      stopWaiting();
      introDestroy?.();
      scrollDestroy?.();
      releaseIntro();
      delete root.dataset.introEntryMuted;
    };
  }, [prefersReducedMotion, unlockScroll]);

  return (
    <section
      id="intro"
      ref={sectionRef}
      tabIndex={-1}
      className="intro-section"
      aria-labelledby="intro-title"
    >
      <div className="intro-layout">
        <h1 id="intro-title" className="intro-role" data-intro-item>
          <span className="sr-only">
            {portfolio.introHeadline.accent} {portfolio.introHeadline.rest}
          </span>
          <span
            className="intro-role-line intro-role-visual intro-line-mask"
            data-intro-role-line
            aria-hidden="true"
          >
            <IntroChars text={portfolio.introHeadline.accent} />
          </span>
          <span
            className="intro-role-line intro-role-line-offset intro-role-visual intro-line-mask"
            data-intro-role-line
            aria-hidden="true"
          >
            <IntroChars text={portfolio.introHeadline.rest} />
          </span>
        </h1>

        <IntroPull
          onActivate={showProjects}
          prefersReducedMotion={prefersReducedMotion}
        />

        <p className="intro-name" data-intro-item>
          <span className="sr-only">{portfolio.introEyebrow}</span>
          <span
            className="intro-name-visual intro-line-mask"
            aria-hidden="true"
          >
            <IntroChars text={portfolio.introEyebrow} />
          </span>
        </p>
      </div>
    </section>
  );
};
