"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  initIntroLoader,
  markIntroReady,
} from "@/lib/animation/introLoader";
import {
  isIntroSeen,
  saveIntroSeen,
} from "@/lib/animation/introSession";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";

const LOADER_FAILSAFE_MS = 8000;

const LOADER_WORDS = [
  "문제를 이해하고",
  "흐름을 설계하고",
  "경험으로 만듭니다",
  "권혁진입니다.",
];

export const IntroLoader = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shouldAnimateRef = useRef(false);
  const finishedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  const { unlockScroll } = useScrollRuntime();

  const revealIntro = useCallback(() => {
    markIntroReady();
  }, []);

  const finishLoader = useCallback(() => {
    if (finishedRef.current) return;

    finishedRef.current = true;
    saveIntroSeen();
    document.documentElement.dataset.introSeen = "true";
    delete document.documentElement.dataset.introLoading;
    if (!document.getElementById("intro")) {
      delete document.documentElement.dataset.introLocked;
      unlockScroll();
    }
    setIsVisible(false);
  }, [unlockScroll]);

  useLayoutEffect(() => {
    // pre-hydration marker를 우선 사용하고, 부트스트랩이 실행되지 않은 경우 세션 저장소를 보완 확인한다.
    if (
      document.documentElement.dataset.introSeen === "true" ||
      isIntroSeen()
    ) {
      document.documentElement.dataset.introSeen = "true";
      delete document.documentElement.dataset.introLoading;
      markIntroReady();
      const skipFrame = window.requestAnimationFrame(() => setIsVisible(false));
      return () => window.cancelAnimationFrame(skipFrame);
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      delete document.documentElement.dataset.introLocked;
      delete document.documentElement.dataset.introLoading;
      markIntroReady();
      unlockScroll();
      const frameId = window.requestAnimationFrame(() => setIsVisible(false));
      return () => window.cancelAnimationFrame(frameId);
    }

    delete document.documentElement.dataset.introReady;
    document.documentElement.dataset.introLocked = "true";
    document.documentElement.dataset.introLoading = "true";
    shouldAnimateRef.current = true;

    return () => {
      delete document.documentElement.dataset.introLoading;
    };
  }, [unlockScroll]);

  useEffect(() => {
    if (!isVisible || !shouldAnimateRef.current || !rootRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;
    const failsafeId = window.setTimeout(() => {
      if (!alive || finishedRef.current) return;

      revealIntro();
      finishLoader();
    }, LOADER_FAILSAFE_MS);

    (async () => {
      try {
        const dispose = await initIntroLoader({
          root: rootRef.current!,
          onReveal: revealIntro,
          onComplete: finishLoader,
        });

        if (!alive) {
          dispose();
          return;
        }

        destroy = dispose;
      } catch {
        if (alive) {
          revealIntro();
          finishLoader();
        }
      }
    })();

    return () => {
      alive = false;
      window.clearTimeout(failsafeId);
      destroy?.();
    };
  }, [finishLoader, isVisible, revealIntro]);

  if (!isVisible) return null;

  return (
    <div
      ref={rootRef}
      className="intro-loader"
      aria-hidden="true"
      data-intro-loader
    >
      <div className="intro-loader-screen" data-loader-screen>
        <div className="intro-loader-words" data-loader-words>
          {LOADER_WORDS.map((word) => (
            <p key={word} className="intro-loader-word" data-loader-word>
              {word}
              <span className="intro-loader-dot" />
            </p>
          ))}
        </div>

        <div className="intro-loader-curve" data-loader-curve>
          <div className="intro-loader-curve-shape" />
        </div>
      </div>
    </div>
  );
};
