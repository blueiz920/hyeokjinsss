import { loadGsap } from "@/lib/gsap/loadGsap";

type RouteParts = {
  bottomCurve: HTMLElement;
  label: HTMLElement;
  screen: HTMLElement;
  topCurve: HTMLElement;
};

type RouteRun = {
  cancel: () => void;
};

const routeRuns = new WeakMap<HTMLElement, RouteRun>();

const topCurveHeight = "10vh";
const bottomCurveHeight = () => (window.innerWidth < 540 ? "5vh" : "10vh");

const getRouteParts = (root: HTMLElement): RouteParts | null => {
  const screen = root.querySelector<HTMLElement>("[data-route-screen]");
  const topCurve = root.querySelector<HTMLElement>("[data-route-top-curve]");
  const bottomCurve = root.querySelector<HTMLElement>(
    "[data-route-bottom-curve]",
  );
  const label = root.querySelector<HTMLElement>("[data-route-label]");

  if (!screen || !topCurve || !bottomCurve || !label) return null;

  return { bottomCurve, label, screen, topCurve };
};

const setRouteStart = (parts: RouteParts) => {
  const { bottomCurve, label, screen, topCurve } = parts;

  screen.style.removeProperty("transform");
  topCurve.style.removeProperty("height");
  bottomCurve.style.removeProperty("height");
  label.style.removeProperty("opacity");
  label.style.removeProperty("transform");
  label.style.removeProperty("visibility");
};

const playRouteTimeline = (
  timeline: {
    to: (
      target: gsap.TweenTarget,
      vars: gsap.TweenVars,
      position?: gsap.Position,
    ) => unknown;
  },
  parts: RouteParts,
  phase: "cover" | "reveal",
) => {
  if (phase === "cover") {
    timeline.to(
      parts.screen,
      { yPercent: 0, duration: 0.5, ease: "power4.in" },
      0,
    );
    timeline.to(
      parts.topCurve,
      { height: topCurveHeight, duration: 0.4, ease: "power4.in" },
      0,
    );
    return;
  }

  timeline.to(
    parts.label,
    { autoAlpha: 1, y: -50, duration: 0.8, ease: "power4.out" },
    0.05,
  );
  timeline.to(
    parts.screen,
    { yPercent: -100, duration: 0.8, ease: "power3.inOut" },
    0.65,
  );
  timeline.to(
    parts.label,
    { autoAlpha: 0, duration: 0.6, ease: "none" },
    0.65,
  );
  timeline.to(
    parts.bottomCurve,
    { height: 0, duration: 0.85, ease: "power3.inOut" },
    0.65,
  );
};

const runRoutePhase = async (root: HTMLElement, phase: "cover" | "reveal") => {
  const parts = getRouteParts(root);
  if (!parts) return;

  const { gsap } = await loadGsap();
  routeRuns.get(root)?.cancel();
  const bottomHeight = bottomCurveHeight();

  if (phase === "cover") {
    gsap.set(parts.screen, { y: 0, yPercent: 100 });
    gsap.set(parts.topCurve, { height: 0 });
    gsap.set(parts.bottomCurve, { height: bottomHeight });
    gsap.set(parts.label, { autoAlpha: 0 });
  } else {
    gsap.set(parts.label, { autoAlpha: 0, y: 0 });
    gsap.set(parts.bottomCurve, { height: bottomHeight });
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timelineRef: { current: gsap.core.Timeline | null } = {
      current: null,
    };
    const run: RouteRun = {
      cancel: () => {
        timelineRef.current?.kill();
        settleRun(() => reject(new Error(`Route ${phase} cancelled`)));
      },
    };
    const settleRun = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (routeRuns.get(root) === run) routeRuns.delete(root);
      callback();
    };
    const timeline = gsap.timeline({
      onComplete: () => settleRun(resolve),
      onInterrupt: () =>
        settleRun(() => reject(new Error(`Route ${phase} interrupted`))),
    });
    timelineRef.current = timeline;
    routeRuns.set(root, run);
    playRouteTimeline(timeline, parts, phase);
  });
};

export const coverRoute = (root: HTMLElement) => runRoutePhase(root, "cover");

export const revealRoute = (root: HTMLElement) => runRoutePhase(root, "reveal");

export const resetRoute = (root: HTMLElement) => {
  routeRuns.get(root)?.cancel();
  const parts = getRouteParts(root);
  if (parts) setRouteStart(parts);
};
