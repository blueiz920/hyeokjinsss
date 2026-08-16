import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MagneticLayer } from "./MagneticLayer";

const magneticMocks = vi.hoisted(() => ({
  initMotion: vi.fn(),
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => magneticMocks.pathname,
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/lib/animation/magnetic", () => ({
  initMagneticMotion: magneticMocks.initMotion,
}));

let mountedRoots: Root[] = [];

const mountLayer = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  const render = async () => {
    await act(async () => {
      root.render(
        <>
          <MagneticLayer />
          <button key={magneticMocks.pathname} data-magnetic>
            {magneticMocks.pathname}
          </button>
        </>,
      );
    });
  };

  await render();
  return { render };
};

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

beforeEach(() => {
  magneticMocks.pathname = "/";
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("MagneticLayer", () => {
  it("상세 페이지를 왕복하면 새 홈 요소에 마그네틱 모션을 다시 연결한다", async () => {
    const disposeHome = vi.fn();
    const disposeDetail = vi.fn();
    const disposeReturn = vi.fn();
    magneticMocks.initMotion
      .mockResolvedValueOnce(disposeHome)
      .mockResolvedValueOnce(disposeDetail)
      .mockResolvedValueOnce(disposeReturn);

    const { render } = await mountLayer();

    expect(magneticMocks.initMotion).toHaveBeenLastCalledWith({
      prefersReducedMotion: false,
      root: document,
    });
    expect(document.querySelector("[data-magnetic]")?.textContent).toBe("/");

    magneticMocks.pathname = "/projects/moum-zip";
    await render();

    expect(disposeHome).toHaveBeenCalledOnce();
    expect(magneticMocks.initMotion).toHaveBeenCalledTimes(2);

    magneticMocks.pathname = "/";
    await render();

    expect(disposeDetail).toHaveBeenCalledOnce();
    expect(magneticMocks.initMotion).toHaveBeenCalledTimes(3);
    expect(document.querySelector("[data-magnetic]")?.textContent).toBe("/");
  });
});
