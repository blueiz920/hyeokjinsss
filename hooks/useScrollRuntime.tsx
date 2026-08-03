"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useReducedMotion } from "./useReducedMotion";
import { startScrollRuntime } from "@/lib/animation/scrollRuntime";

type ScrollRuntimeValue = {
  lockScroll: () => void;
  prefersReducedMotion: boolean;
  unlockScroll: () => void;
};

type ScrollRuntime = ReturnType<typeof startScrollRuntime>;

const ScrollRuntimeContext = createContext<ScrollRuntimeValue | null>(null);

// 전역 스크롤 runtime을 React 생명주기에 연결하고 모션 정책을 Context로 제공한다.
export const ScrollRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = useReducedMotion();
  const runtimeRef = useRef<ScrollRuntime | null>(null);

  const lockScroll = useCallback(() => runtimeRef.current?.lockScroll(), []);
  const unlockScroll = useCallback(
    () => runtimeRef.current?.unlockScroll(),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runtime = startScrollRuntime({
      initiallyLocked:
        !prefersReducedMotion &&
        document.documentElement.dataset.introLocked === "true",
      prefersReducedMotion,
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
  }, [prefersReducedMotion]);

  const value = useMemo(
    () => ({ lockScroll, prefersReducedMotion, unlockScroll }),
    [lockScroll, prefersReducedMotion, unlockScroll],
  );

  return <ScrollRuntimeContext.Provider value={value}>{children}</ScrollRuntimeContext.Provider>;
};

// ScrollRuntimeProvider가 제공한 모션 정책을 읽고 잘못된 사용 위치를 즉시 알린다.
export const useScrollRuntime = () => {
  const context = useContext(ScrollRuntimeContext);
  if (!context) throw new Error("useScrollRuntime must be used within ScrollRuntimeProvider");
  return context;
};
