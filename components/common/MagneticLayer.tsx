"use client";

import { useEffect } from "react";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { initMagneticMotion } from "@/lib/animation/magnetic";

export const MagneticLayer = () => {
  const { prefersReducedMotion } = useScrollRuntime();

  useEffect(() => {
    let isActive = true;
    let disposeMotion: (() => void) | null = null;

    void initMagneticMotion({
      prefersReducedMotion,
      root: document,
    })
      .then((dispose) => {
        if (!isActive) {
          dispose();
          return;
        }

        disposeMotion = dispose;
      })
      .catch((error) => {
        if (!isActive) return;
        console.error(
          "Magnetic control motion failed; using static controls.",
          error,
        );
      });

    return () => {
      isActive = false;
      disposeMotion?.();
    };
  }, [prefersReducedMotion]);

  return null;
};
