let gsapPromise: Promise<{
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  MotionPathPlugin: typeof import("gsap/MotionPathPlugin").MotionPathPlugin;
}> | null = null;

export const loadGsap = async () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("GSAP can only load in the browser"));
  }

  if (!gsapPromise) {
    gsapPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/MotionPathPlugin"),
    ]).then(([gsapModule, scrollTriggerModule, motionPathModule]) => {
      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      const MotionPathPlugin = motionPathModule.MotionPathPlugin;

      gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
      return { gsap, ScrollTrigger, MotionPathPlugin };
    });
  }

  return gsapPromise;
};
