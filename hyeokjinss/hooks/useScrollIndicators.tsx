"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ProjectsIndicatorState = {
  active: boolean;
  step: number; // 0..total-1
  total: number; // 카드 개수
  everActive: boolean; // ✅ 한 번이라도 active=true였는지(초기 깜빡임 방지/exit 애니 허용)
};

type ScrollIndicatorsValue = {
  projects: ProjectsIndicatorState;
  setProjectsActive: (active: boolean) => void;
  setProjectsStep: (step: number) => void;
  setProjectsTotal: (total: number) => void;
  resetProjects: () => void;
};

const ScrollIndicatorsContext = createContext<ScrollIndicatorsValue | null>(null);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const ScrollIndicatorsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [projects, setProjects] = useState<ProjectsIndicatorState>({
    active: false,
    step: 0,
    total: 0,
    everActive: false,
  });

  const setProjectsActive = useCallback((active: boolean) => {
    setProjects((prev) => {
      const nextEverActive = prev.everActive || active;
      // 불필요 업데이트 방지
      if (prev.active === active && prev.everActive === nextEverActive) return prev;
      return { ...prev, active, everActive: nextEverActive };
    });
  }, []);

  const setProjectsTotal = useCallback((total: number) => {
    setProjects((prev) => {
      const nextTotal = Math.max(0, total);
      const nextStep =
        nextTotal <= 0 ? 0 : clamp(prev.step, 0, Math.max(0, nextTotal - 1));

      if (prev.total === nextTotal && prev.step === nextStep) return prev;
      return { ...prev, total: nextTotal, step: nextStep };
    });
  }, []);

  const setProjectsStep = useCallback((step: number) => {
    setProjects((prev) => {
      if (prev.total <= 0) {
        if (prev.step === 0) return prev;
        return { ...prev, step: 0 };
      }
      const nextStep = clamp(step, 0, Math.max(0, prev.total - 1));
      if (nextStep === prev.step) return prev;
      return { ...prev, step: nextStep };
    });
  }, []);

  const resetProjects = useCallback(() => {
    setProjects({ active: false, step: 0, total: 0, everActive: false });
  }, []);

  const value = useMemo(
    () => ({
      projects,
      setProjectsActive,
      setProjectsStep,
      setProjectsTotal,
      resetProjects,
    }),
    [projects, setProjectsActive, setProjectsStep, setProjectsTotal, resetProjects],
  );

  return (
    <ScrollIndicatorsContext.Provider value={value}>
      {children}
    </ScrollIndicatorsContext.Provider>
  );
};

export const useScrollIndicators = () => {
  const ctx = useContext(ScrollIndicatorsContext);
  if (!ctx)
    throw new Error("useScrollIndicators must be used within ScrollIndicatorsProvider");
  return ctx;
};
