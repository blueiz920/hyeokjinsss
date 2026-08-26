"use client";

import { useEffect, useRef, useState } from "react";

export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const progressRafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const next = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setProgress(next);
    };

    const scheduleProgressUpdate = () => {
      if (progressRafIdRef.current !== null) return;

      // 스크롤 이벤트가 몰릴 수 있어서 프레임당 한 번만 진행률을 계산함.
      progressRafIdRef.current = window.requestAnimationFrame(() => {
        progressRafIdRef.current = null;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleProgressUpdate);
      if (progressRafIdRef.current !== null) {
        window.cancelAnimationFrame(progressRafIdRef.current);
        progressRafIdRef.current = null;
      }
    };
  }, []);

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
      </div>
    </>
  );
};
