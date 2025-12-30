"use client";

import { useEffect, useState } from "react";

export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setProgress(nextProgress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 h-1 w-full bg-white/10">
      <div
        className="h-full bg-white"
        style={{ transform: `scaleX(${progress})`, transformOrigin: "0%" }}
        aria-hidden="true"
      />
    </div>
  );
};
