"use client";

import { useEffect, useMemo, useState } from "react";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";

export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const { projects } = useScrollIndicators();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const next = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setProgress(next);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const total = projects.total;
  const showDots = projects.active && total > 0;
  const everActive = projects.everActive; // ✅ SSOT

  const STAGGER_MS = 75;
  const DURATION_MS = 200;

  const dotStyles = useMemo(() => {
    if (total <= 0) return [];

    return Array.from({ length: total }, (_, i) => {
      // 처음부터 showDots=false인 초기 로드에서는 out 애니메이션 자체를 금지(깜빡임 방지)
      if (!showDots && !everActive) return undefined;

      const delay = showDots ? i * STAGGER_MS : Math.max(0, total - 1 - i) * STAGGER_MS;
      const name = showDots ? "sp-dot-in" : "sp-dot-out";

      return {
        animationName: name,
        animationDuration: `${DURATION_MS}ms`,
        animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        animationFillMode: "both",
        animationDelay: `${delay}ms`,
      } as const;
    });
  }, [total, showDots, everActive]);

  return (
    <>
        {/* Mobile: top bar */}
    <div className="fixed top-0 left-0 z-50 h-1 w-full bg-white/10 md:hidden">
      <div
        className="h-full bg-white"
        style={{ transform: `scaleX(${progress})`, transformOrigin: "0%" }}
        aria-hidden="true"
      />
    </div>

    {/* Mobile: dots */}
    <div
      className="fixed left-1/2 top-[1.9rem] z-50 md:hidden pointer-events-none -translate-x-1/2"
      aria-hidden="true"
    >
      {total > 0 && (
        <ol className="flex flex-row gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === projects.step;
            const initialHidden = !showDots && !everActive;

            return (
              <li
                key={i}
                style={dotStyles[i]}
                className={initialHidden ? "opacity-0 translate-x-2" : ""}
              >
                <span
                  className={[
                    "block h-2 w-2 rounded-full border border-white/20",
                    "transition-[transform,background-color] duration-200",
                    isActive ? "bg-white scale-125" : "bg-white/20 scale-100",
                  ].join(" ")}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>

      {/* Desktop+: left rail + dots */}
    <div
      className="fixed left-4 top-[13.5rem] z-50 hidden h-[50vh] w-10 md:block pointer-events-none"
      aria-hidden="true"
    >
      {/* rail */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
      <div
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 origin-top bg-white"
        style={{ transform: `scaleY(${progress})` }}
      />

      {/* projects dots */}
      {total > 0 && (
        <ol className="absolute left-full ml-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === projects.step;
            const initialHidden = !showDots && !everActive;

            return (
              <li key={i} style={dotStyles[i]} className={initialHidden ? "opacity-0 translate-x-2" : ""}>
                <span
                  className={[
                    "block h-2 w-2 rounded-full border border-white/20",
                    "transition-[transform,background-color] duration-200",
                    isActive ? "bg-white scale-125" : "bg-white/20 scale-100",
                  ].join(" ")}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
    </>
  );
};
