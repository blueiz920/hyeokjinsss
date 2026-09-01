import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroLoader } from "./IntroLoader";
import { INTRO_SESSION_KEY } from "@/lib/animation/introSession";

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
  vi.useRealTimers();
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.introLocked;
  delete document.documentElement.dataset.introLoading;
  delete document.documentElement.dataset.introReady;
  delete document.documentElement.dataset.introSeen;
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

describe("IntroLoader", () => {
  it("애니메이션 시작 전에 초기 스크롤 잠금을 소유한다", async () => {
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

  it("로딩이 끝나면 잠금을 인트로 진입 과정에 넘긴다", async () => {
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
    expect(document.documentElement.dataset.introSeen).toBe("true");
    expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe("true");
    expect(loaderMocks.unlockScroll).not.toHaveBeenCalled();
    expect(container.querySelector("[data-intro-loader]")).toBeNull();
  });

  it("모션 축소 환경에서는 애니메이션을 생략하고 잠금을 해제한다", async () => {
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

  it("같은 탭에서 완료한 로더는 잠금과 애니메이션을 다시 시작하지 않는다", async () => {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(loaderMocks.initIntroLoader).not.toHaveBeenCalled();
    expect(loaderMocks.markIntroReady).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
    expect(document.documentElement.dataset.introSeen).toBe("true");
  });

  it("로더 초기화가 멈추면 안전장치가 인트로와 스크롤을 완료한다", async () => {
    vi.useFakeTimers();
    loaderMocks.initIntroLoader.mockImplementation(() => new Promise(() => {}));
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));
    expect(container.querySelector("[data-intro-loader]")).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    expect(loaderMocks.markIntroReady).toHaveBeenCalledOnce();
    expect(loaderMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
    expect(document.documentElement.dataset.introLoading).toBeUndefined();
    expect(container.querySelector("[data-intro-loader]")).toBeNull();
    expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe("true");
  });

  it("로더 초기화가 실패해도 인트로와 스크롤을 완료한다", async () => {
    loaderMocks.initIntroLoader.mockRejectedValueOnce(new Error("load failed"));
    const container = document.createElement("div");
    const root = createRoot(container);
    document.body.appendChild(container);
    mountedRoots.push(root);

    await act(async () => root.render(<IntroLoader />));

    expect(loaderMocks.markIntroReady).toHaveBeenCalledOnce();
    expect(loaderMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
    expect(document.documentElement.dataset.introLoading).toBeUndefined();
    expect(container.querySelector("[data-intro-loader]")).toBeNull();
  });
});
