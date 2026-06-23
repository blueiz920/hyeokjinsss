"use client";

import { type RefObject, useEffect, useState } from "react";
import { getIntroMaskRect, type IntroMaskRect } from "@/lib/motion/introMask";

type IntroMaskDebugBoxProps = {
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

const INITIAL_RECT_TRACK_MS = 1000;
const RESIZE_RECT_TRACK_MS = 180;

export const IntroMaskDebugBox = ({ disabled, headingRef }: IntroMaskDebugBoxProps) => {
  const [rect, setRect] = useState<IntroMaskRect | null>(null);

  useEffect(() => {
    if (disabled || process.env.NODE_ENV !== "development" || typeof window === "undefined") {
      return;
    }

    let alive = true;
    let rafId: number | null = null;
    let trackUntil = 0;

    const updateRect = () => {
      if (!alive) return;

      const heading = headingRef.current;
      setRect(heading ? getIntroMaskRect(heading) : null);
    };

    const trackRect = (now: number) => {
      updateRect();

      if (now < trackUntil) {
        rafId = window.requestAnimationFrame(trackRect);
        return;
      }

      rafId = null;
    };

    const startRectTracking = (duration: number) => {
      if (!alive) return;

      // intro 진입 transform 동안 fixed debug box가 밀리지 않게 초반만 추적함.
      updateRect();
      trackUntil = Math.max(trackUntil, window.performance.now() + duration);

      if (rafId === null) {
        rafId = window.requestAnimationFrame(trackRect);
      }
    };
    const handleResize = () => startRectTracking(RESIZE_RECT_TRACK_MS);

    startRectTracking(INITIAL_RECT_TRACK_MS);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateRect, { passive: true });
    void document.fonts?.ready.then(() => startRectTracking(RESIZE_RECT_TRACK_MS));

    return () => {
      alive = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateRect);
    };
  }, [disabled, headingRef]);

  if (disabled || process.env.NODE_ENV !== "development" || !rect) {
    return null;
  }

  return (
    <div
      // aria-hidden="true"
      // className="intro-mask-debug-box"
      // style={{
      //   height: rect.height,
      //   left: rect.left,
      //   top: rect.top,
      //   width: rect.width,
      // }}
    />
  );
};
