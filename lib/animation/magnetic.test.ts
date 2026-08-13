import { afterEach, describe, expect, it, vi } from "vitest";
import { initMagneticMotion } from "@/lib/animation/magnetic";

const motionMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: motionMocks.loadGsap,
}));

function createMedia(initialMatches = true) {
  let listener: (() => void) | null = null;
  const media = {
    matches: initialMatches,
    addEventListener: vi.fn((_type: string, nextListener: () => void) => {
      listener = nextListener;
    }),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    media,
    setMatches(matches: boolean) {
      Object.assign(media, { matches });
      listener?.();
    },
  };
}

function createMagnet() {
  const root = document.createElement("div");
  root.innerHTML = `
    <button
      data-magnetic
      data-magnetic-strength="20"
      data-magnetic-label-strength="10"
    >
      <span data-magnetic-label>Work</span>
    </button>
  `;

  const element = root.querySelector<HTMLElement>("[data-magnetic]");
  if (!element) throw new Error("Magnetic fixture is missing.");

  Object.defineProperties(element, {
    offsetHeight: { configurable: true, value: 40 },
    offsetWidth: { configurable: true, value: 100 },
  });
  element.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: 60,
        height: 40,
        left: 10,
        right: 110,
        top: 20,
        width: 100,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect,
  );

  return { element, root };
}

function createHarness() {
  const gsap = {
    killTweensOf: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
  };
  motionMocks.loadGsap.mockResolvedValue({ gsap });
  return gsap;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initMagneticMotion", () => {
  it("원본 비율식과 분리된 라벨 강도로 포인터를 추종한다", async () => {
    const { element, root } = createMagnet();
    const media = createMedia();
    const gsap = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initMagneticMotion({
      prefersReducedMotion: false,
      root,
    });

    element.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 90,
        clientY: 40,
      }),
    );

    expect(gsap.to.mock.calls[0]?.[0]).toBe(element);
    expect(gsap.to.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        duration: 1.5,
        ease: "power4.out",
        y: 0,
      }),
    );
    expect(gsap.to.mock.calls[0]?.[1].x).toBeCloseTo(6);

    expect(gsap.to.mock.calls[1]?.[0]).toBe(
      element.querySelector("[data-magnetic-label]"),
    );
    expect(gsap.to.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        duration: 1.5,
        ease: "power4.out",
        y: 0,
      }),
    );
    expect(gsap.to.mock.calls[1]?.[1].x).toBeCloseTo(3);

    element.dispatchEvent(new MouseEvent("mouseleave"));
    expect(gsap.to).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({
        duration: 1.5,
        ease: "elastic.out(1, 0.3)",
        x: 0,
        y: 0,
      }),
    );

    cleanup();
    expect(gsap.set).toHaveBeenLastCalledWith(expect.any(Array), {
      clearProps: "x,y,rotation",
    });
  });

  it("미세 포인터 미디어가 바뀌면 이벤트 수신기와 인라인 변형을 정리한다", async () => {
    const { element, root } = createMagnet();
    const media = createMedia(false);
    const gsap = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initMagneticMotion({
      prefersReducedMotion: false,
      root,
    });

    element.dispatchEvent(new MouseEvent("mousemove", { clientX: 90 }));
    expect(gsap.to).not.toHaveBeenCalled();

    media.setMatches(true);
    element.dispatchEvent(new MouseEvent("mousemove", { clientX: 90 }));
    expect(gsap.to).toHaveBeenCalledTimes(2);

    media.setMatches(false);
    expect(gsap.set).toHaveBeenCalledWith(expect.any(Array), {
      clearProps: "x,y,rotation",
    });

    cleanup();
    expect(media.media.removeEventListener).toHaveBeenCalledOnce();
  });

  it("모션 축소 환경에서는 GSAP과 포인터 이벤트 수신기를 사용하지 않는다", async () => {
    const cleanup = await initMagneticMotion({
      prefersReducedMotion: true,
      root: createMagnet().root,
    });

    expect(motionMocks.loadGsap).not.toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
  });
});
