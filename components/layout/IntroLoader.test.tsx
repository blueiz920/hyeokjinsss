import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroLoader } from "./IntroLoader";

const loaderMocks = vi.hoisted(() => ({
  initIntroLoader: vi.fn(),
  markIntroReady: vi.fn(),
  unlockScroll: vi.fn(),
}));

vi.mock("@/lib/animation/introLoader", () => ({
  initIntroLoader: loaderMocks.initIntroLoader,
  markIntroReady: loaderMocks.markIntroReady,
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ unlockScroll: loaderMocks.unlockScroll }),
}));

let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  });
  loaderMocks.initIntroLoader.mockImplementation(async ({ onReveal, onComplete }) => {
    onReveal();
    onComplete();
    return () => {};
  });
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.introLocked;
  delete document.documentElement.dataset.introLoading;
  delete document.documentElement.dataset.introReady;
  vi.clearAllMocks();
});

describe("IntroLoader", () => {
  it("claims the initial scroll lock before its animation starts", async () => {
    loaderMocks.initIntroLoader.mockImplementation(() => new Promise(() => {}));
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(document.documentElement.dataset.introLocked).toBe("true");
    expect(document.documentElement.dataset.introLoading).toBe("true");
    expect(loaderMocks.initIntroLoader).toHaveBeenCalledOnce();
  });

  it("hands its lock to the Intro entry when loading completes", async () => {
    const intro = document.createElement("section");
    intro.id = "intro";
    document.body.appendChild(intro);
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(loaderMocks.markIntroReady).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introLocked).toBe("true");
    expect(document.documentElement.dataset.introLoading).toBeUndefined();
    expect(loaderMocks.unlockScroll).not.toHaveBeenCalled();
    expect(container.querySelector("[data-intro-loader]")).toBeNull();
  });

  it("skips animation and releases the lock for reduced motion", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(loaderMocks.initIntroLoader).not.toHaveBeenCalled();
    expect(loaderMocks.markIntroReady).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
    expect(document.documentElement.dataset.introLoading).toBeUndefined();
    expect(loaderMocks.unlockScroll).toHaveBeenCalledOnce();
  });
});
