import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollProgress } from "./ScrollProgress";

let mountedRoots: Root[] = [];

const mountProgress = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => root.render(<ScrollProgress />));

  return { container, root };
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 500,
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 125,
  });
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  vi.restoreAllMocks();
});

describe("ScrollProgress", () => {
  it("페이지 전체 스크롤 비율을 진행률 막대에 반영한다", async () => {
    const requestAnimationFrame = vi.fn(() => 1);
    const cancelAnimationFrame = vi.fn();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancelAnimationFrame,
    });

    const { container } = await mountProgress();
    const progressBar = container.querySelector(
      ".fixed.top-0 .h-full.bg-white",
    );

    expect(progressBar).not.toBeNull();
    expect(progressBar?.getAttribute("style")).toContain("scaleX(0.25)");
  });

  it("언마운트할 때 예약된 진행률 프레임을 취소한다", async () => {
    const requestAnimationFrame = vi.fn(() => 23);
    const cancelAnimationFrame = vi.fn();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancelAnimationFrame,
    });

    const { root } = await mountProgress();
    window.dispatchEvent(new Event("scroll"));

    await act(async () => root.unmount());
    mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(23);
  });
});
