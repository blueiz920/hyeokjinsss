"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  JSX,
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

export const ScrollRuntimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [lenisEnabled, setLenisEnabled] = useState(true);
  type LenisInstance = InstanceType<typeof Lenis>;

  const lenisRef = useRef<null | { lenis: LenisInstance; rafId: number }>(null);

  const toggleLenis = useCallback(() => {
    setLenisEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const setup = async () => {
      const [{ default: Lenis }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        loadGsap().then(({ ScrollTrigger }) => ({ ScrollTrigger })),
      ]);

      if (cancelled) {
        return;
      }

      if (lenisRef.current) {
        lenisRef.current.lenis.destroy();
        cancelAnimationFrame(lenisRef.current.rafId);
        lenisRef.current = null;
      }

      if (!lenisEnabled) {
        document.documentElement.dataset.lenis = "false";
        ScrollTrigger.refresh();
        return;
      }

      const lenis = new Lenis({
        lerp: prefersReducedMotion ? 0.2 : 0.12,
        wheelMultiplier: prefersReducedMotion ? 0.7 : 1,
        smoothWheel: true,
      });

      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });

      const raf = (time: number) => {
        lenis.raf(time);
        lenisRef.current!.rafId = requestAnimationFrame(raf);
      };

      lenisRef.current = {
        lenis,
        rafId: requestAnimationFrame(raf),
      };

      document.documentElement.dataset.lenis = "true";
      ScrollTrigger.refresh();
    };

    setup();

    return () => {
      cancelled = true;
      if (lenisRef.current) {
        lenisRef.current.lenis.destroy();
        cancelAnimationFrame(lenisRef.current.rafId);
        lenisRef.current = null;
      }
    };
  }, [lenisEnabled, prefersReducedMotion]);

  const value = useMemo(
    () => ({ lenisEnabled, prefersReducedMotion, toggleLenis }),
    [lenisEnabled, prefersReducedMotion, toggleLenis],
  );

  return (
    <ScrollRuntimeContext.Provider value={value}>
      {children}
    </ScrollRuntimeContext.Provider>
  );
};

export const useScrollRuntime = () => {
  const context = useContext(ScrollRuntimeContext);
  if (!context) {
    throw new Error("useScrollRuntime must be used within ScrollRuntimeProvider");
  }
  return context;
};
