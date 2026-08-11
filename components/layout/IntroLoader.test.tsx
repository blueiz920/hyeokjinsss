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
  loaderMocks.initIntroLoader.mockImplementation(async ({ onComplete }) => {
    onComplete();
    return () => {};
  });
  document.documentElement.dataset.introLocked = "true";
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.introLocked;
  vi.clearAllMocks();
});

describe("IntroLoader", () => {
  it("releases the initial scroll lock when a direct route has no Intro section", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(document.documentElement.dataset.introLocked).toBeUndefined();
    expect(loaderMocks.unlockScroll).toHaveBeenCalledOnce();
  });
});
