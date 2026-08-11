import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteTransition, useRouteTransition } from "./RouteTransition";

const routeMocks = vi.hoisted(() => ({
  coverRoute: vi.fn(),
  lockScroll: vi.fn(),
  pathname: "/",
  prefersReducedMotion: false,
  push: vi.fn(),
  resetRoute: vi.fn(),
  revealRoute: vi.fn(),
  unlockScroll: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routeMocks.pathname,
  useRouter: () => ({ push: routeMocks.push }),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({
    lockScroll: routeMocks.lockScroll,
    prefersReducedMotion: routeMocks.prefersReducedMotion,
    unlockScroll: routeMocks.unlockScroll,
  }),
}));

vi.mock("@/lib/animation/routeTransition", () => ({
  coverRoute: routeMocks.coverRoute,
  resetRoute: routeMocks.resetRoute,
  revealRoute: routeMocks.revealRoute,
}));

let mountedRoots: Root[] = [];

const Trigger = ({ href = "/projects/moum-zip" }: { href?: string }) => {
  const { navigate } = useRouteTransition();
  return <button onClick={() => navigate(href, "모음.zip")}>Navigate</button>;
};

const mountTransition = async (href?: string) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  const render = async () => {
    await act(async () => {
      root.render(
        <RouteTransition>
          <Trigger href={href} />
        </RouteTransition>,
      );
    });
  };

  await render();
  return { button: container.querySelector("button")!, render };
};

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

beforeEach(() => {
  routeMocks.pathname = "/";
  routeMocks.prefersReducedMotion = false;
  routeMocks.coverRoute.mockResolvedValue(undefined);
  routeMocks.revealRoute.mockResolvedValue(undefined);
});

afterEach(async () => {
  vi.useRealTimers();
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.routeLocked;
  vi.clearAllMocks();
});

describe("RouteTransition", () => {
  it("covers, navigates, then reveals and releases its scroll lock", async () => {
    const { button, render } = await mountTransition();

    await act(async () => button.click());

    expect(routeMocks.lockScroll).toHaveBeenCalledOnce();
    expect(routeMocks.coverRoute).toHaveBeenCalledOnce();
    expect(routeMocks.push).toHaveBeenCalledWith("/projects/moum-zip");

    routeMocks.pathname = "/projects/moum-zip";
    await render();

    expect(routeMocks.revealRoute).toHaveBeenCalledOnce();
    expect(routeMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.routeLocked).toBeUndefined();
  });

  it("releases a stalled cover and ignores its late completion", async () => {
    vi.useFakeTimers();
    let finishCover!: () => void;
    routeMocks.coverRoute.mockReturnValue(
      new Promise<void>((resolve) => {
        finishCover = resolve;
      }),
    );
    const { button } = await mountTransition();

    await act(async () => button.click());
    await act(async () => vi.advanceTimersByTime(5000));

    expect(routeMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(routeMocks.push).not.toHaveBeenCalled();

    await act(async () => finishCover());
    expect(routeMocks.push).not.toHaveBeenCalled();
  });

  it("uses direct navigation for same-path query changes", async () => {
    const { button } = await mountTransition("/?filter=frontend");

    await act(async () => button.click());

    expect(routeMocks.push).toHaveBeenCalledWith("/?filter=frontend");
    expect(routeMocks.coverRoute).not.toHaveBeenCalled();
    expect(routeMocks.lockScroll).not.toHaveBeenCalled();
  });

  it("ignores a stale reveal completion after timeout cleanup", async () => {
    vi.useFakeTimers();
    let finishReveal!: () => void;
    routeMocks.revealRoute.mockReturnValue(
      new Promise<void>((resolve) => {
        finishReveal = resolve;
      }),
    );
    const { button, render } = await mountTransition();

    await act(async () => button.click());
    routeMocks.pathname = "/projects/moum-zip";
    await render();
    await act(async () => vi.advanceTimersByTime(5000));

    expect(routeMocks.unlockScroll).toHaveBeenCalledOnce();

    await act(async () => finishReveal());
    expect(routeMocks.unlockScroll).toHaveBeenCalledOnce();
  });

  it("skips motion and locking when reduced motion is preferred", async () => {
    routeMocks.prefersReducedMotion = true;
    const { button } = await mountTransition();

    await act(async () => button.click());

    expect(routeMocks.push).toHaveBeenCalledWith("/projects/moum-zip");
    expect(routeMocks.coverRoute).not.toHaveBeenCalled();
    expect(routeMocks.lockScroll).not.toHaveBeenCalled();
  });
});
