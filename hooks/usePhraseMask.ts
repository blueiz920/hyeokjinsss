"use client";

import { type RefObject, useEffect, useState } from "react";
import { measureIntroMask } from "@/lib/motion/introMask";
import {
  createPhraseMask,
  supportsCssMask,
  type PhraseMaskBox,
} from "@/lib/motion/introPhraseMask";

type PhraseMaskOptions = {
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  hostRef: RefObject<HTMLElement | null>;
  onReady?: () => void;
  phrase: string;
};

const MIN_VIEWPORT_WIDTH = 768;
const INITIAL_RECT_TRACK_MS = 1000;
const RESIZE_RECT_TRACK_MS = 180;
const RECT_EPSILON = 0.1;
const INTRO_REST_SCROLL_EPSILON = 2;
const SCROLL_REST_RECT_TRACK_MS = 1000;

// 인트로 문구의 반응형 마스크 위치를 측정하고 최신 상태로 유지함.
export const usePhraseMask = ({
  disabled,
  headingRef,
  hostRef,
  onReady,
  phrase,
}: PhraseMaskOptions) => {
  const [isDesktopLike, setIsDesktopLike] = useState(false);
  const [maskState, setMaskState] = useState<PhraseMaskBox | null>(null);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const media = window.matchMedia(`(min-width: ${MIN_VIEWPORT_WIDTH}px)`);

    // 현재 미디어쿼리 결과를 렌더링 상태에 반영함.
    const syncViewport = () => setIsDesktopLike(media.matches);

    syncViewport();
    media.addEventListener("change", syncViewport);

    return () => {
      media.removeEventListener("change", syncViewport);
    };
  }, [disabled]);

  useEffect(() => {
    if (disabled || !isDesktopLike || typeof window === "undefined" || !supportsCssMask()) {
      return;
    }

    let alive = true;
    let rafId: number | null = null;
    let scrollRetryRafId: number | null = null;
    let trackUntil = 0;
    let lastState: PhraseMaskBox | null = null;

    // 화면이 보이고 인트로가 원래 위치일 때만 측정을 허용함.
    const canMeasure = () =>
      document.visibilityState !== "hidden" &&
      window.scrollY <= INTRO_REST_SCROLL_EPSILON;

    // 렌더링에 영향을 줄 정도로 마스크 값이 달라졌는지 확인함.
    const didMaskChange = (nextState: PhraseMaskBox) =>
      !lastState ||
      Math.abs(lastState.height - nextState.height) > RECT_EPSILON ||
      Math.abs(lastState.left - nextState.left) > RECT_EPSILON ||
      lastState.maskImage !== nextState.maskImage ||
      Math.abs(lastState.top - nextState.top) > RECT_EPSILON ||
      Math.abs(lastState.width - nextState.width) > RECT_EPSILON;

    // 유효한 영역을 측정할 수 없을 때 저장된 마스크를 비움.
    const clearMask = () => {
      if (lastState === null) return;

      lastState = null;
      setMaskState(null);
    };

    // 현재 문구 영역을 측정해 변경된 마스크 상태만 반영함.
    const updateMask = () => {
      if (!alive || !canMeasure()) return;

      const heading = headingRef.current;
      const host = hostRef.current;
      const rect = heading ? measureIntroMask(heading) : null;

      if (!heading || !host || !rect) {
        clearMask();
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

      if (didMaskChange(nextState)) {
        lastState = nextState;
        setMaskState(nextState);
        onReady?.();
      }
    };

    // 지정된 추적 시간이 끝날 때까지 프레임마다 마스크를 다시 측정함.
    const trackFrame = (now: number) => {
      if (!alive) return;

      // 스크롤로 글자가 흩어진 상태에서는 잘못된 rect를 저장하지 않음.
      updateMask();

      if (now < trackUntil) {
        rafId = window.requestAnimationFrame(trackFrame);
        return;
      }

      rafId = null;
    };

    // 레이아웃이 변하는 동안 마스크 측정용 RAF 추적을 예약함.
    const trackMask = (duration: number) => {
      if (!alive) return;

      updateMask();
      trackUntil = Math.max(trackUntil, window.performance.now() + duration);

      if (rafId === null) {
        rafId = window.requestAnimationFrame(trackFrame);
      }
    };

    // 뷰포트 크기 변경 뒤 짧게 마스크 측정을 반복함.
    const onResize = () => trackMask(RESIZE_RECT_TRACK_MS);

    // 상단 복귀가 감지되면 마스크를 안정적으로 다시 측정함.
    const onScroll = () => {
      if (scrollRetryRafId !== null || !canMeasure()) return;

      scrollRetryRafId = window.requestAnimationFrame(() => {
        scrollRetryRafId = null;
        trackMask(SCROLL_REST_RECT_TRACK_MS);
      });
    };

    trackMask(INITIAL_RECT_TRACK_MS);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    void document.fonts?.ready.then(() => trackMask(RESIZE_RECT_TRACK_MS));

    return () => {
      alive = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (scrollRetryRafId !== null) {
        window.cancelAnimationFrame(scrollRetryRafId);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [disabled, headingRef, hostRef, isDesktopLike, onReady, phrase]);

  return { isDesktopLike, maskState };
};
