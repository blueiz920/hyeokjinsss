"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  initIntroLoader,
  markIntroReady,
} from "@/lib/animation/introLoader";

const LOADER_SESSION_KEY = "portfolio:intro-loader:v1";
const LOADER_WORDS = [
  "문제를 이해하고",
  "흐름을 설계하고",
  "경험으로 만듭니다",
  "권혁진입니다.",
];
const LOADER_BOOT_SCRIPT = `
try {
  const seen = sessionStorage.getItem("${LOADER_SESSION_KEY}") === "done";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (seen || reduced) document.documentElement.dataset.introSkip = "true";
} catch {}
`;

export const IntroLoader = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shouldAnimateRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);

  const finishLoader = useCallback(() => {
    try {
      window.sessionStorage.setItem(LOADER_SESSION_KEY, "done");
    } catch {}

    delete document.documentElement.dataset.introLoading;
    document.documentElement.dataset.introSkip = "true";
    markIntroReady();
    setIsVisible(false);
  }, []);

  useLayoutEffect(() => {
    let hasSeenLoader = false;

    try {
      hasSeenLoader =
        window.sessionStorage.getItem(LOADER_SESSION_KEY) === "done";
    } catch {}

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (hasSeenLoader || prefersReducedMotion) {
      document.documentElement.dataset.introSkip = "true";
      markIntroReady();
      const frameId = window.requestAnimationFrame(() => setIsVisible(false));
      return () => window.cancelAnimationFrame(frameId);
    }

    delete document.documentElement.dataset.introSkip;
    delete document.documentElement.dataset.introReady;
    document.documentElement.dataset.introLoading = "true";
    shouldAnimateRef.current = true;

    return () => {
      delete document.documentElement.dataset.introLoading;
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !shouldAnimateRef.current || !rootRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      try {
        const dispose = await initIntroLoader({
          root: rootRef.current!,
          onComplete: finishLoader,
        });

        if (!alive) {
          dispose();
          return;
        }

        destroy = dispose;
      } catch {
        if (alive) finishLoader();
      }
    })();

    return () => {
      alive = false;
      destroy?.();
    };
  }, [finishLoader, isVisible]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LOADER_BOOT_SCRIPT }} />
      {isVisible && (
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
      )}
    </>
  );
};
