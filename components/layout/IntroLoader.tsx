"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  initIntroLoader,
  markIntroReady,
} from "@/lib/animation/introLoader";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";

const LOADER_WORDS = [
  "문제를 이해하고",
  "흐름을 설계하고",
  "경험으로 만듭니다",
  "권혁진입니다.",
];

export const IntroLoader = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shouldAnimateRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  const { unlockScroll } = useScrollRuntime();

  const revealIntro = useCallback(() => {
    markIntroReady();
  }, []);

  const finishLoader = useCallback(() => {
    delete document.documentElement.dataset.introLoading;
    if (!document.getElementById("intro")) {
      delete document.documentElement.dataset.introLocked;
      unlockScroll();
    }
    setIsVisible(false);
  }, [unlockScroll]);

  useLayoutEffect(() => {
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
