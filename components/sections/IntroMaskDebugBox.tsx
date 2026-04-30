"use client";

import { type RefObject, useEffect, useState } from "react";

type IntroMaskDebugBoxProps = {
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

type DebugRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const INITIAL_RECT_TRACK_MS = 1000;
const RESIZE_RECT_TRACK_MS = 180;

const getMaskRect = (heading: HTMLElement): DebugRect | null => {
  const rects = [
    ...heading.querySelectorAll<HTMLElement>(
      ".intro-title-mask-char, [data-intro-mask-phrase-anchor]",
    ),
  ]
    .map((char) => char.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (!rects.length) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return {
    height: bottom - top,
    left,
    top,
    width: right - left,
  };
};

export const IntroMaskDebugBox = ({ disabled, headingRef }: IntroMaskDebugBoxProps) => {
  const [rect, setRect] = useState<DebugRect | null>(null);

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
      setRect(heading ? getMaskRect(heading) : null);
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
      aria-hidden="true"
      className="intro-mask-debug-box"
      style={{
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      }}
    />
  );
};
