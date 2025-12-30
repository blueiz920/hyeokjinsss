export const motionDefaults = {
  ease: "power2.out",
  duration: 0.6,
};

export const getStepSnap = (steps: number) => {
  if (steps <= 1) {
    return 1;
  }
  return 1 / (steps - 1);
};
