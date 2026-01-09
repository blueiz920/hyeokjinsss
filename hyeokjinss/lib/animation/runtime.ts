export const motionDefaults = {
  ease: "power2.out",
  duration: 0.6,
} as const;

export const getStepSnap = (steps: number) => {
  if (steps <= 1) return 1;
  return 1 / (steps - 1);
};

// 추가 유틸(기존 호환)
export const getFrameHeight = (el: HTMLElement) =>
  Math.max(1, Math.round(el.getBoundingClientRect().height));

export const capEnd = (value: number, cap: number) => {
  const v = Math.max(0, Math.round(value));
  const c = Math.max(1, Math.round(cap));
  return Math.min(v, c);
};