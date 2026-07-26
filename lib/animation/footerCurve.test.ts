import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initFooterCurve } from "@/lib/animation/footerCurve";

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

describe("initFooterCurve", () => {
  it("푸터 전체 진입 구간에서 곡면을 0까지 평탄화한다", async () => {
    const footer = document.createElement("footer");
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

    const cleanup = await initFooterCurve({ curve, footer });

    expect(gsap.set).toHaveBeenCalledWith(curve, {
      willChange: "height",
    });
    expect(gsap.to).toHaveBeenCalledWith(curve, {
      height: 0,
      ease: "none",
      scrollTrigger: {
        trigger: footer,
        start: "top bottom",
        end: "bottom bottom",
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
