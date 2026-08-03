"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";
import { useScrollRuntime } from "./useScrollRuntime";

type SectionRegistryValue = {
  register: (id: string, ref: React.RefObject<HTMLElement | null>) => void;
  unregister: (id: string) => void;
  scrollTo: (id: string) => void;
};

const SectionRegistryContext = createContext<SectionRegistryValue | null>(null);

export const SectionRegistryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const registry = useRef(new Map<string, React.RefObject<HTMLElement | null>>());
  const intentTarget = useRef<string | null>(null);
  const intentTimer = useRef<number | null>(null);
  const { prefersReducedMotion } = useScrollRuntime();

  const sendIntent = useCallback((detail: SectionIntentDetail) => {
    document.dispatchEvent(
      new CustomEvent<SectionIntentDetail>(SECTION_INTENT_EVENT, { detail }),
    );
  }, []);

  const finishIntent = useCallback(() => {
    const id = intentTarget.current;
    if (!id) return;

    if (intentTimer.current !== null) {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = null;
    }

    sendIntent({ id, phase: "end" });
    intentTarget.current = null;
    if (document.documentElement.dataset.sectionTarget === id) {
      delete document.documentElement.dataset.sectionTarget;
    }
  }, [sendIntent]);

  useEffect(() => {
    document.addEventListener("scrollend", finishIntent);

    return () => {
      document.removeEventListener("scrollend", finishIntent);
      if (intentTimer.current !== null) {
        window.clearTimeout(intentTimer.current);
      }
      delete document.documentElement.dataset.sectionTarget;
    };
  }, [finishIntent]);

  const register = useCallback(
    (id: string, ref: React.RefObject<HTMLElement | null>) => {
      registry.current.set(id, ref);
    },
    [],
  );

  const unregister = useCallback((id: string) => {
    registry.current.delete(id);
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const entry = registry.current.get(id);
      const node = entry?.current ?? document.getElementById(id);
      if (!node) return;

      finishIntent();
      intentTarget.current = id;
      document.documentElement.dataset.sectionTarget = id;
      sendIntent({ id, phase: "start" });

      node.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      node.focus({ preventScroll: true });

      if (prefersReducedMotion) {
        requestAnimationFrame(finishIntent);
        return;
      }

      intentTimer.current = window.setTimeout(finishIntent, 2500);
    },
    [finishIntent, prefersReducedMotion, sendIntent],
  );

  const value = useMemo(
    () => ({ register, unregister, scrollTo }),
    [register, unregister, scrollTo],
  );

  return (
    <SectionRegistryContext.Provider value={value}>
      {children}
    </SectionRegistryContext.Provider>
  );
};

export const useSectionRegistry = () => {
  const context = useContext(SectionRegistryContext);
  if (!context) {
    throw new Error("useSectionRegistry must be used within SectionRegistryProvider");
  }
  return context;
};
