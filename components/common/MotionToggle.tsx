"use client";

import { useScrollRuntime } from "@/hooks/useScrollRuntime";

export const MotionToggle = () => {
  const { lenisEnabled, prefersReducedMotion, toggleLenis } = useScrollRuntime();
  const motionToggleLabel = prefersReducedMotion
    ? "움직임 줄이기 설정으로 부드러운 스크롤이 비활성화되어 있습니다."
    : lenisEnabled
      ? "부드러운 스크롤 켜짐. 클릭하면 정적 스크롤로 전환합니다."
      : "부드러운 스크롤 꺼짐. 클릭하면 부드러운 스크롤로 전환합니다.";

  return (
    <button
      type="button"
      onClick={toggleLenis}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
      aria-label={motionToggleLabel}
      aria-pressed={lenisEnabled}
    >
      <span>{lenisEnabled ? "Smooth" : "Static"}</span>
      <span className="text-white/60">
        {prefersReducedMotion ? "Reduced" : "Full"}
      </span>
    </button>
  );
};
