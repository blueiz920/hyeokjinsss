"use client";

import { useMemo } from "react";
import { useScrollIndicators } from "@/hooks/useScrollIndicators";

const STAGGER_MS = 75;
const DURATION_MS = 200;

// 홈 Projects의 현재 단계만 표시하고 페이지 진행률과 분리한다.
export const ProjectStepIndicator = () => {
  const { projects } = useScrollIndicators();
  const total = projects.total;
  const showDots = projects.active && total > 0;
  const everActive = projects.everActive;

  const dotStyles = useMemo(() => {
    if (total <= 0) return [];

    return Array.from({ length: total }, (_, index) => {
      // 처음부터 비활성인 초기 로드에서는 퇴장 애니메이션을 실행하지 않는다.
      if (!showDots && !everActive) return undefined;

      const delay = showDots
        ? index * STAGGER_MS
        : Math.max(0, total - 1 - index) * STAGGER_MS;
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

  const renderDotList = (className: string) => (
    <ol className={className}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === projects.step;
        const initialHidden = !showDots && !everActive;

        return (
          <li
            key={index}
            style={dotStyles[index]}
            className={initialHidden ? "opacity-0 translate-x-2" : ""}
          >
            <span
              className={[
                "block h-2 w-2 rounded-full border border-white/20",
                "transition-[transform,background-color] duration-200",
                isActive
                  ? "border-amber-200/60 bg-amber-300 scale-125 shadow-[0_0_16px_rgba(251,191,36,0.45)]"
                  : "bg-white/20 scale-100",
              ].join(" ")}
            />
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Mobile: dots */}
      <div
        className="fixed left-1/2 top-[1.9rem] z-50 md:hidden pointer-events-none -translate-x-1/2"
        aria-hidden="true"
      >
        {total > 0 && renderDotList("flex flex-row gap-2")}
      </div>

      {/* Desktop: dots overlay the same rail geometry as the old combined indicator. */}
      <div
        className="fixed left-4 top-[13.5rem] z-50 hidden h-[50vh] w-10 md:block pointer-events-none"
        aria-hidden="true"
      >
        {total > 0 &&
          renderDotList(
            "absolute left-full ml-3 top-1/2 -translate-y-1/2 flex flex-col gap-2",
          )}
      </div>
    </>
  );
};
