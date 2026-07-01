"use client";

import { type CSSProperties, type RefObject, useEffect, useState } from "react";
import { getIntroMaskRect } from "@/lib/motion/introMask";
import {
  canUseCssMask,
  createPhraseMask,
  type PhraseMaskBox,
} from "@/lib/motion/introPhraseMask";

type IntroPhraseTextureOverlayProps = {
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  hostRef: RefObject<HTMLElement | null>;
  onReady?: () => void;
  phrase: string;
  src: string;
};

const MIN_VIEWPORT_WIDTH = 768;
const INITIAL_RECT_TRACK_MS = 1000;
const RESIZE_RECT_TRACK_MS = 180;
const RECT_EPSILON = 0.1;
const INTRO_REST_SCROLL_EPSILON = 2;
const SCROLL_REST_RECT_TRACK_MS = 1000;

export const IntroPhraseTextureOverlay = ({
  disabled,
  headingRef,
  hostRef,
  onReady,
  phrase,
  src,
}: IntroPhraseTextureOverlayProps) => {
  const [isDesktopLike, setIsDesktopLike] = useState(false);
  const [maskState, setMaskState] = useState<PhraseMaskBox | null>(null);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const media = window.matchMedia(`(min-width: ${MIN_VIEWPORT_WIDTH}px)`);
    const updateViewportState = () => setIsDesktopLike(media.matches);

    updateViewportState();
    media.addEventListener("change", updateViewportState);

    return () => {
      media.removeEventListener("change", updateViewportState);
    };
  }, [disabled]);

  useEffect(() => {
    if (disabled || !isDesktopLike || typeof window === "undefined" || !canUseCssMask()) {
      return;
    }

    let alive = true;
    let rafId: number | null = null;
    let scrollRetryRafId: number | null = null;
    let trackUntil = 0;
    let lastState: PhraseMaskBox | null = null;

    const canMeasureMask = () => {
      if (document.visibilityState === "hidden") return false;

      return window.scrollY <= INTRO_REST_SCROLL_EPSILON;
    };

    const hasRectChanged = (nextState: PhraseMaskBox) =>
      !lastState ||
      Math.abs(lastState.height - nextState.height) > RECT_EPSILON ||
      Math.abs(lastState.left - nextState.left) > RECT_EPSILON ||
      lastState.maskImage !== nextState.maskImage ||
      Math.abs(lastState.top - nextState.top) > RECT_EPSILON ||
      Math.abs(lastState.width - nextState.width) > RECT_EPSILON;

    const resetMask = () => {
      if (lastState === null) return;

      lastState = null;
      setMaskState(null);
    };

    const measureMask = () => {
      if (!alive) return;
      if (!canMeasureMask()) return;

      const heading = headingRef.current;
      const host = hostRef.current;
      const rect = heading ? getIntroMaskRect(heading) : null;

      if (!heading || !host || !rect) {
        resetMask();
        return;
      }

      const hostRect = host.getBoundingClientRect();

      const nextState = {
        height: rect.height,
        left: rect.left - hostRect.left,
        maskImage: createPhraseMask(heading, host, phrase, rect.width, rect.height),
        top: rect.top - hostRect.top,
        width: rect.width,
      };

      if (hasRectChanged(nextState)) {
        lastState = nextState;
        setMaskState(nextState);
        onReady?.();
      }
    };

    const tick = (now: number) => {
      if (!alive) return;

      // 스크롤로 글자가 흩어진 상태에서는 잘못된 rect를 저장하지 않음.
      measureMask();

      if (now < trackUntil) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      rafId = null;
    };

    const trackFor = (duration: number) => {
      if (!alive) return;

      measureMask();
      trackUntil = Math.max(trackUntil, window.performance.now() + duration);

      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleResize = () => trackFor(RESIZE_RECT_TRACK_MS);
    const handleScroll = () => {
      if (scrollRetryRafId !== null || !canMeasureMask()) return;

      scrollRetryRafId = window.requestAnimationFrame(() => {
        scrollRetryRafId = null;
        trackFor(SCROLL_REST_RECT_TRACK_MS);
      });
    };

    trackFor(INITIAL_RECT_TRACK_MS);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    void document.fonts?.ready.then(() => trackFor(RESIZE_RECT_TRACK_MS));

    return () => {
      alive = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (scrollRetryRafId !== null) {
        window.cancelAnimationFrame(scrollRetryRafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [disabled, headingRef, hostRef, isDesktopLike, onReady, phrase]);

  if (disabled) {
    return null;
  }

  const maskStyle = maskState
    ? ({
        height: maskState.height,
        maskImage: maskState.maskImage,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "100% 100%",
        left: maskState.left,
        top: maskState.top,
        WebkitMaskImage: maskState.maskImage,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        width: maskState.width,
      } satisfies CSSProperties)
    : null;

  return (
    <span
      aria-hidden="true"
      className="intro-phrase-texture-layer"
      data-intro-phrase-texture
      style={maskStyle ?? undefined}
    >
      {isDesktopLike && maskStyle ? (
        <video
          autoPlay
          className={
            process.env.NODE_ENV === "development"
              ? "intro-phrase-texture-overlay intro-phrase-texture-overlay--debug"
              : "intro-phrase-texture-overlay"
          }
          loop
          muted
          playsInline
          preload="auto"
          src={src}
        />
      ) : null}
    </span>
  );
};
