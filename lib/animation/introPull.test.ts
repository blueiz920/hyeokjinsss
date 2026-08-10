import { afterEach, describe, expect, it, vi } from "vitest";
import { initIntroPull } from "./introPull";

const pullMocks = vi.hoisted(() => ({
  killTweensOf: vi.fn(),
  loadGsap: vi.fn(),
  to: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: pullMocks.loadGsap,
}));

const createPull = () => {
  const root = document.createElement("button");
  root.dataset.pullState = "pull";
  root.innerHTML = `
    <svg>
      <path data-pull-line d="M0 100 C225 100 390 100 500 100 C610 100 775 100 1000 100"></path>
      <path data-pull-hit d="M0 100 C225 100 390 100 500 100 C610 100 775 100 1000 100"></path>
    </svg>
    <span data-pull-label>PULL!</span>
    <span data-pull-status>선을 아래로 당기세요.</span>
  `;
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
    bottom: 144,
    height: 144,
    left: 0,
    right: 600,
    top: 0,
    width: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  root.setPointerCapture = vi.fn();
  root.hasPointerCapture = vi.fn(() => true);
  root.releasePointerCapture = vi.fn();
  return root;
};

const sendPointer = (
  root: HTMLButtonElement,
  type: string,
  {
    clientX = 300,
    clientY,
    pointerId = 1,
    pointerType = "touch",
  }: {
    clientX?: number;
    clientY: number;
    pointerId?: number;
    pointerType?: string;
  },
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
  });
  root.querySelector("[data-pull-hit]")?.dispatchEvent(event);
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("initIntroPull", () => {
  it("pointer hover만으로 가까운 x에서 선과 PULL 안내를 반응시킨다", async () => {
    const root = createPull();
    const onDrop = vi.fn();
    pullMocks.to.mockImplementation((target, options) => {
      if (typeof options.x === "number") target.x = options.x;
      if (typeof options.y === "number") target.y = options.y;
      options.onUpdate?.();
    });
    pullMocks.loadGsap.mockResolvedValue({
      gsap: {
        killTweensOf: pullMocks.killTweensOf,
        to: pullMocks.to,
      },
    });
    const cleanup = await initIntroPull({
      root,
      onDrop,
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointermove", {
      clientX: 120,
      clientY: 80,
      pointerType: "mouse",
    });

    expect(root.dataset.pullHover).toBe("true");
    expect(root.querySelector("[data-pull-label]")?.textContent).toBe("PULL!");
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("120px");
    expect(root.querySelector("[data-pull-line]")?.getAttribute("d")).toContain(
      "200",
    );
    expect(onDrop).not.toHaveBeenCalled();

    root.dispatchEvent(new Event("pointerleave"));
    expect(root.dataset.pullHover).toBeUndefined();

    cleanup();
  });

  it("오른쪽 아래 drag는 실제 오른쪽 접점을 따르고 release에서 한 번 이동한다", async () => {
    const root = createPull();
    const onDrop = vi.fn();
    pullMocks.to.mockImplementation((target, options) => {
      if (typeof options.x === "number") target.x = options.x;
      if (typeof options.y === "number") target.y = options.y;
      options.onUpdate?.();
    });
    pullMocks.loadGsap.mockResolvedValue({
      gsap: {
        killTweensOf: pullMocks.killTweensOf,
        to: pullMocks.to,
      },
    });
    const cleanup = await initIntroPull({
      root,
      onDrop,
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointermove", {
      clientX: 450,
      clientY: 80,
      pointerType: "mouse",
    });
    sendPointer(root, "pointerdown", {
      clientX: 450,
      clientY: 80,
      pointerType: "mouse",
    });
    sendPointer(root, "pointermove", {
      clientX: 540,
      clientY: 160,
      pointerType: "mouse",
    });

    expect(root.dataset.pullState).toBe("drop");
    expect(root.querySelector("[data-pull-label]")?.textContent).toBe("DROP!");
    expect(root.querySelector("[data-pull-line]")?.getAttribute("d")).toContain(
      "900",
    );
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("540px");

    sendPointer(root, "pointerup", {
      clientX: 540,
      clientY: 160,
      pointerType: "mouse",
    });

    expect(onDrop).toHaveBeenCalledOnce();
    expect(root.dataset.pullState).toBe("pull");
    expect(root.dataset.pullSuppressClick).toBe("true");
    expect(pullMocks.to).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        duration: 0.8,
        ease: "elastic.out(1, 0.35)",
        x: 300,
        y: 0,
      }),
    );

    cleanup();
  });

  it("임계점 전 release와 pointer cancel은 이동하지 않고 원위치로 돌아간다", async () => {
    const root = createPull();
    const onDrop = vi.fn();
    pullMocks.loadGsap.mockResolvedValue({
      gsap: {
        killTweensOf: pullMocks.killTweensOf,
        to: pullMocks.to,
      },
    });
    const cleanup = await initIntroPull({
      root,
      onDrop,
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointerdown", { clientY: 72 });
    sendPointer(root, "pointermove", { clientX: 340, clientY: 100 });
    sendPointer(root, "pointerup", { clientX: 340, clientY: 100 });
    sendPointer(root, "pointerdown", { clientY: 72, pointerId: 2 });
    sendPointer(root, "pointermove", {
      clientX: 420,
      clientY: 160,
      pointerId: 2,
    });
    sendPointer(root, "pointercancel", {
      clientX: 420,
      clientY: 160,
      pointerId: 2,
    });

    expect(onDrop).not.toHaveBeenCalled();
    expect(root.dataset.pullState).toBe("pull");
    expect(pullMocks.to).toHaveBeenCalledTimes(2);

    cleanup();
  });

  it("reduced motion은 GSAP 없이 같은 임계점 동작을 제공한다", async () => {
    const root = createPull();
    const onDrop = vi.fn();
    const cleanup = await initIntroPull({
      root,
      onDrop,
      prefersReducedMotion: true,
    });

    sendPointer(root, "pointerdown", { clientX: 420, clientY: 72 });
    sendPointer(root, "pointermove", { clientX: 500, clientY: 160 });
    sendPointer(root, "pointerup", { clientX: 500, clientY: 160 });

    expect(pullMocks.loadGsap).not.toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalledOnce();
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("300px");
    expect(root.style.getPropertyValue("--intro-pull-y")).toBe("72px");

    cleanup();
  });
});
