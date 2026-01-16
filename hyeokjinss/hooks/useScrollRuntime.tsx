"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "./useReducedMotion";
import { loadGsap } from "@/lib/gsap/loadGsap";
import Lenis from "lenis";

type ScrollRuntimeValue = {
  lenisEnabled: boolean;
  prefersReducedMotion: boolean;
  toggleLenis: () => void;
};

const ScrollRuntimeContext = createContext<ScrollRuntimeValue | null>(null);

type LenisInstance = InstanceType<typeof Lenis>;

export const ScrollRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = useReducedMotion();
  const [lenisEnabled, setLenisEnabled] = useState(true);

  const lenisRef = useRef<LenisInstance | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const removeRefreshListenerRef = useRef<(() => void) | null>(null);

  const toggleLenis = useCallback(() => {
    setLenisEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const cleanup = () => {
      // remove refresh listener
      if (removeRefreshListenerRef.current) {
        removeRefreshListenerRef.current();
        removeRefreshListenerRef.current = null;
      }

      // stop raf
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // destroy lenis
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };

    const setup = async () => {
      const { ScrollTrigger } = await loadGsap();
      if (cancelled) return;

      // 항상 같은 스크롤러(문서)로 통일: Lenis ON/OFF 상관없이 안정적
      const scrollerEl = document.documentElement;
      ScrollTrigger.defaults({ scroller: scrollerEl });

      // scrollerProxy는 "Lenis가 있으면 Lenis로", 없으면 native로" 동작하도록 안전하게 구성
      ScrollTrigger.scrollerProxy(scrollerEl, {
        scrollTop(value) {
          if (typeof value === "number") {
            const lenis = lenisRef.current;
            if (lenisEnabled && lenis) {
              // ScrollTrigger가 스냅 등으로 "스크롤을 설정"할 때 Lenis에 위임
              lenis.scrollTo(value, { immediate: true });
            } else {
              window.scrollTo(0, value);
            }
          }

          // ScrollTrigger가 "현재 스크롤을 읽을 때"
          const lenis = lenisRef.current;
          if (lenisEnabled && lenis) {
            // Lenis 내부 스크롤 값을 우선 사용
            return lenis.scroll;
          }
          return window.scrollY;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: "fixed",
      });

      // 기존 Lenis/RAF 정리
      cleanup();

      if (!lenisEnabled) {
        document.documentElement.dataset.lenis = "false";
        ScrollTrigger.refresh();
        return;
      }

      // Lenis 생성
      const lenis = new Lenis({
        lerp: prefersReducedMotion ? 0.25 : 0.28,
        wheelMultiplier: prefersReducedMotion ? 0.6 : 0.6,
        smoothWheel: true,
      });

      lenisRef.current = lenis;

      // Lenis 스크롤 -> ScrollTrigger 업데이트
      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });

      // RAF 루프
      const raf = (time: number) => {
        lenis.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      };
      rafIdRef.current = requestAnimationFrame(raf);

      // refresh 시 lenis 리사이즈 + 트리거 재계산
      const onRefresh = () => {
        // Lenis가 컨텐츠 높이를 다시 계산하게
        lenis.resize();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);
      removeRefreshListenerRef.current = () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
      };

      document.documentElement.dataset.lenis = "true";
      ScrollTrigger.refresh();
    };

    setup();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [lenisEnabled, prefersReducedMotion]);

  const value = useMemo(
    () => ({ lenisEnabled, prefersReducedMotion, toggleLenis }),
    [lenisEnabled, prefersReducedMotion, toggleLenis],
  );

  return <ScrollRuntimeContext.Provider value={value}>{children}</ScrollRuntimeContext.Provider>;
};

export const useScrollRuntime = () => {
  const context = useContext(ScrollRuntimeContext);
  if (!context) throw new Error("useScrollRuntime must be used within ScrollRuntimeProvider");
  return context;
};
