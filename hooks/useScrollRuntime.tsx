"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { startScrollRuntime } from "@/lib/animation/scrollRuntime";

type ScrollRuntimeValue = {
  prefersReducedMotion: boolean;
};

const ScrollRuntimeContext = createContext<ScrollRuntimeValue | null>(null);

// 전역 스크롤 runtime을 React 생명주기에 연결하고 모션 정책을 Context로 제공한다.
export const ScrollRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runtime = startScrollRuntime({ prefersReducedMotion });
    return runtime.dispose;
  }, [prefersReducedMotion]);

  const value = useMemo(
    () => ({ prefersReducedMotion }),
    [prefersReducedMotion],
  );

  return <ScrollRuntimeContext.Provider value={value}>{children}</ScrollRuntimeContext.Provider>;
};

// ScrollRuntimeProvider가 제공한 모션 정책을 읽고 잘못된 사용 위치를 즉시 알린다.
export const useScrollRuntime = () => {
  const context = useContext(ScrollRuntimeContext);
  if (!context) throw new Error("useScrollRuntime must be used within ScrollRuntimeProvider");
  return context;
};
