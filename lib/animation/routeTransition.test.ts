import { afterEach, describe, expect, it, vi } from "vitest";
import { coverRoute, resetRoute, revealRoute } from "./routeTransition";

const routeMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: routeMocks.loadGsap,
}));

const createRoot = () => {
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-route-screen>
      <div data-route-top-curve></div>
      <p data-route-label>Destination</p>
      <div data-route-bottom-curve></div>
    </div>
  `;
  return root;
};

const createGsap = () => {
  const timeline = {
    kill: vi.fn(),
    to: vi.fn(),
  };
  const gsap = {
    set: vi.fn(),
    timeline: vi.fn((options: { onComplete: () => void }) => {
      queueMicrotask(options.onComplete);
      return timeline;
    }),
  };
  routeMocks.loadGsap.mockResolvedValue({ gsap });
  return { gsap, timeline };
};

afterEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
});

describe("route transition animation", () => {
  it("covers with the screen and mirrored top curve before navigation", async () => {
    const { gsap, timeline } = createGsap();
    const root = createRoot();

    await coverRoute(root);

    expect(gsap.set).toHaveBeenCalledWith(
      root.querySelector("[data-route-screen]"),
      { y: 0, yPercent: 100 },
    );
    expect(timeline.to).toHaveBeenCalledWith(
      root.querySelector("[data-route-screen]"),
      { yPercent: 0, duration: 0.5, ease: "power4.in" },
      0,
    );
    expect(timeline.to).toHaveBeenCalledWith(
      root.querySelector("[data-route-top-curve]"),
      { height: "10vh", duration: 0.4, ease: "power4.in" },
      0,
    );
  });

  it("reveals with the destination label and bottom curve", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const { gsap, timeline } = createGsap();
    const root = createRoot();

    await revealRoute(root);

    expect(gsap.set).toHaveBeenCalledWith(
      root.querySelector("[data-route-label]"),
      { autoAlpha: 1 },
    );
    expect(timeline.to).toHaveBeenCalledWith(
      root.querySelector("[data-route-screen]"),
      { yPercent: -100, duration: 0.8, ease: "power3.inOut" },
      0,
    );
    expect(timeline.to).toHaveBeenCalledWith(
      root.querySelector("[data-route-bottom-curve]"),
      { height: 0, duration: 0.85, ease: "power3.inOut" },
      0,
    );
    expect(gsap.set).toHaveBeenCalledWith(
      root.querySelector("[data-route-bottom-curve]"),
      { height: "5vh" },
    );
  });

  it("restores CSS-owned starting values after an interrupted route", () => {
    const root = createRoot();
    const screen = root.querySelector<HTMLElement>("[data-route-screen]")!;
    const topCurve = root.querySelector<HTMLElement>("[data-route-top-curve]")!;
    const bottomCurve = root.querySelector<HTMLElement>("[data-route-bottom-curve]")!;
    const label = root.querySelector<HTMLElement>("[data-route-label]")!;
    screen.style.transform = "translateY(-100%)";
    topCurve.style.height = "10vh";
    bottomCurve.style.height = "0px";
    label.style.opacity = "1";
    label.style.visibility = "visible";

    resetRoute(root);

    expect(screen.style.transform).toBe("");
    expect(topCurve.style.height).toBe("");
    expect(bottomCurve.style.height).toBe("");
    expect(label.style.opacity).toBe("");
    expect(label.style.visibility).toBe("");
  });

  it("kills an active timeline before restoring the CSS start state", async () => {
    let timelineOptions!: { onComplete: () => void; onInterrupt: () => void };
    const timeline = { kill: vi.fn(), to: vi.fn() };
    routeMocks.loadGsap.mockResolvedValue({
      gsap: {
        set: vi.fn(),
        timeline: vi.fn((options) => {
          timelineOptions = options;
          return timeline;
        }),
      },
    });
    const root = createRoot();
    const phase = coverRoute(root);
    await vi.waitFor(() => expect(timeline.to).toHaveBeenCalled());

    resetRoute(root);

    expect(timeline.kill).toHaveBeenCalledOnce();
    await expect(phase).rejects.toThrow("Route cover cancelled");
    timelineOptions.onComplete();
  });
});
