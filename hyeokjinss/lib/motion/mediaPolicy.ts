export const mediaPolicy = {
  prefersReducedMotion: "Honor OS-level reduced-motion and soften scrub distances.",
  maxPinnedSections: 2,
  allowedProperties: ["transform", "opacity"],
} as const;

export type MotionProfile = {
  density: number;   // 배경 아이콘 개수(대략)
  drift: number;     // 배경 이동량(px)
  blurMax: number;   // px (가능하면 reduced면 0)
  scrub: number;     // 0.2 ~ 0.9
  capMultiplier: number; // skills 같은 pin 섹션 end cap 배수
};

export const getMotionProfile = (prefersReducedMotion: boolean): MotionProfile => {
  if (typeof window === "undefined") {
    return { density: 10, drift: 36, blurMax: 6, scrub: 0.8, capMultiplier: 3 };
  }

  const small = window.matchMedia("(max-width: 768px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  if (prefersReducedMotion) {
    return {
      density: small ? 6 : 8,
      drift: 18,
      blurMax: 0,
      scrub: 0.25,
      capMultiplier: 2,
    };
  }

  if (small || coarse) {
    return {
      density: 8,
      drift: 26,
      blurMax: 4,
      scrub: 0.7,
      capMultiplier: 3,
    };
  }

  return { density: 12, drift: 40, blurMax: 6, scrub: 0.85, capMultiplier: 3 };
};