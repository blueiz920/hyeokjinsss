"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

export type SectionEntry = {
  id: string;
  ref: React.RefObject<HTMLElement | null>;
};

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

  const register = useCallback(
    (id: string, ref: React.RefObject<HTMLElement | null>) => {
      registry.current.set(id, ref);
    },
    [],
  );

  const unregister = useCallback((id: string) => {
    registry.current.delete(id);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const entry = registry.current.get(id);
    const node = entry?.current ?? document.getElementById(id);
    if (!node) {
      return;
    }

    node.scrollIntoView({ behavior: "smooth", block: "start" });
    node.focus({ preventScroll: true });
  }, []);

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
