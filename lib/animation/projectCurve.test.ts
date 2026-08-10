import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initProjectCurve } from "@/lib/animation/projectCurve";

const curveMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: curveMocks.loadGsap,
}));

beforeEach(() => {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }),
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initProjectCurve", () => {
  it("Projects 진입 구간에서 Intro 곡면을 0까지 평탄화한다", async () => {
    const section = document.createElement("section");
    const curve = document.createElement("div");
    const trigger = { kill: vi.fn() };
    const tween = {
      kill: vi.fn(),
      scrollTrigger: trigger,
    };
    const gsap = {
      set: vi.fn(),
      to: vi.fn(() => tween),
    };
    const ScrollTrigger = {
      refresh: vi.fn(),
    };
    curveMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

    const cleanup = await initProjectCurve({ section, curve });

    expect(gsap.set).toHaveBeenCalledWith(curve, {
      willChange: "height",
    });
    expect(gsap.to).toHaveBeenCalledWith(curve, {
      height: 0,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    expect(ScrollTrigger.refresh).toHaveBeenCalledOnce();

    cleanup();

    expect(trigger.kill).toHaveBeenCalledOnce();
    expect(tween.kill).toHaveBeenCalledOnce();
    expect(gsap.set).toHaveBeenLastCalledWith(curve, {
      clearProps: "height,willChange",
    });
  });
});
