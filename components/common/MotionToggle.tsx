"use client";

import { useScrollRuntime } from "@/hooks/useScrollRuntime";

export const MotionToggle = () => {
  const { lenisEnabled, prefersReducedMotion, toggleLenis } = useScrollRuntime();

  return (
    <button
      type="button"
      onClick={toggleLenis}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
      aria-pressed={lenisEnabled}
    >
      <span>{lenisEnabled ? "Smooth" : "Static"}</span>
      <span className="text-white/60">
        {prefersReducedMotion ? "Reduced" : "Full"}
      </span>
    </button>
  );
};
