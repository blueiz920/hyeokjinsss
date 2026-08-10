let gsapPromise: Promise<{
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  MotionPathPlugin: typeof import("gsap/MotionPathPlugin").MotionPathPlugin;
  CustomEase: typeof import("gsap/CustomEase").CustomEase;
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
      import("gsap/CustomEase"),
    ]).then(
      ([gsapModule, scrollTriggerModule, motionPathModule, customEaseModule]) => {
        const gsap = gsapModule.gsap || gsapModule.default;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        const MotionPathPlugin = motionPathModule.MotionPathPlugin;
        const CustomEase = customEaseModule.CustomEase;

        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, CustomEase);
        return { gsap, ScrollTrigger, MotionPathPlugin, CustomEase };
      },
    );
  }

  return gsapPromise;
};
