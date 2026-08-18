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
  document.body.appendChild(root);
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
  document.body.replaceChildren();
  delete document.documentElement.dataset.introEntering;
  delete document.documentElement.dataset.introReady;
});

describe("initIntroPull", () => {
  it("포인터를 올리기만 해도 가까운 가로 위치에서 선과 당기기 안내를 반응시킨다", async () => {
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

    const leave = new Event("pointerout");
    Object.defineProperty(leave, "relatedTarget", { value: null });
    window.dispatchEvent(leave);
    expect(root.dataset.pullHover).toBeUndefined();

    cleanup();
  });

  it("선에 닿기 전 넓은 거리에서 위치 기반으로 미세 반응한다", async () => {
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointermove", {
      clientX: 120,
      clientY: 140,
      pointerType: "mouse",
    });

    expect(root.dataset.pullAware).toBe("true");
    expect(root.dataset.pullHover).toBeUndefined();
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("120px");
    expect(
      Number(root.style.getPropertyValue("--intro-pull-awareness")),
    ).toBeGreaterThan(0);

    cleanup();
  });

  it("인트로 진입 완료 뒤 당김선을 같은 간격으로 1분 동안 시연한다", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    vi.advanceTimersByTime(799);
    expect(root.dataset.pullDemo).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(root.dataset.pullDemo).toBe("true");
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("372px");
    expect(root.style.getPropertyValue("--intro-pull-y")).toBe("82px");

    vi.advanceTimersByTime(10_999);
    expect(pullMocks.to).toHaveBeenCalledTimes(4);

    vi.advanceTimersByTime(1);
    expect(pullMocks.to).toHaveBeenCalledTimes(5);

    vi.advanceTimersByTime(48_200);
    expect(root.dataset.pullDemo).toBeUndefined();
    expect(pullMocks.to).toHaveBeenCalledTimes(22);

    vi.advanceTimersByTime(60_000);
    expect(pullMocks.to).toHaveBeenCalledTimes(22);

    cleanup();
  });

  it("인트로 진입 중에는 자가 시연을 시작하지 않는다", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.introReady = "true";
    document.documentElement.dataset.introEntering = "true";
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    vi.advanceTimersByTime(2000);
    expect(root.dataset.pullDemo).toBeUndefined();

    delete document.documentElement.dataset.introEntering;
    await Promise.resolve();
    vi.advanceTimersByTime(799);
    expect(root.dataset.pullDemo).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(root.dataset.pullDemo).toBe("true");

    cleanup();
  });

  it("호버로 진행 중인 자가 시연을 중단해도 다음 간격에 재개한다", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    vi.advanceTimersByTime(800);
    expect(root.dataset.pullDemo).toBe("true");

    sendPointer(root, "pointermove", {
      clientX: 120,
      clientY: 80,
      pointerType: "mouse",
    });
    expect(root.dataset.pullDemo).toBeUndefined();

    vi.advanceTimersByTime(4149);
    expect(root.dataset.pullDemo).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(root.dataset.pullDemo).toBeUndefined();

    const leave = new Event("pointerout");
    Object.defineProperty(leave, "relatedTarget", { value: null });
    window.dispatchEvent(leave);

    vi.advanceTimersByTime(4149);
    expect(root.dataset.pullDemo).toBeUndefined();
    vi.advanceTimersByTime(1);

    expect(root.dataset.pullDemo).toBe("true");

    cleanup();
  });

  it("짧은 포인터 누름과 놓기 뒤 다음 간격에 자가 시연을 재개한다", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointerdown", {
      clientY: 72,
      pointerType: "touch",
    });
    sendPointer(root, "pointerup", {
      clientY: 120,
      pointerType: "touch",
    });

    expect(root.dataset.pullActive).toBeUndefined();
    vi.advanceTimersByTime(4149);
    expect(root.dataset.pullDemo).toBeUndefined();
    vi.advanceTimersByTime(1);

    expect(root.dataset.pullDemo).toBe("true");

    cleanup();
  });

  it("활성 드래그 중에는 자가 시연을 시작하지 않고 놓은 뒤 재개한다", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
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
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });

    sendPointer(root, "pointerdown", {
      clientY: 72,
      pointerType: "touch",
    });
    expect(root.dataset.pullActive).toBe("true");

    vi.advanceTimersByTime(4150);
    expect(root.dataset.pullDemo).toBeUndefined();

    sendPointer(root, "pointerup", {
      clientY: 120,
      pointerType: "touch",
    });
    expect(root.dataset.pullActive).toBeUndefined();

    vi.advanceTimersByTime(4149);
    expect(root.dataset.pullDemo).toBeUndefined();
    vi.advanceTimersByTime(1);

    expect(root.dataset.pullDemo).toBe("true");

    cleanup();
  });

  it("오른쪽 아래로 드래그하면 실제 오른쪽 접점을 따르고 놓을 때 한 번 이동한다", async () => {
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

  it("터치 드래그 시작은 브라우저 스크롤 제스처로 넘어가지 않는다", async () => {
    const root = createPull();
    pullMocks.loadGsap.mockResolvedValue({
      gsap: {
        killTweensOf: pullMocks.killTweensOf,
        to: pullMocks.to,
      },
    });
    const cleanup = await initIntroPull({
      root,
      onDrop: vi.fn(),
      prefersReducedMotion: false,
    });
    const event = new Event("pointerdown", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperties(event, {
      button: { value: 0 },
      clientX: { value: 300 },
      clientY: { value: 72 },
      pointerId: { value: 1 },
      pointerType: { value: "touch" },
    });

    root.querySelector("[data-pull-hit]")?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(root.dataset.pullActive).toBe("true");

    cleanup();
  });

  it("임계점 전에 놓거나 포인터가 취소되면 이동하지 않고 원위치로 돌아간다", async () => {
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

  it("모션 축소 환경은 GSAP 없이 같은 임계점 동작을 제공한다", async () => {
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

  it("모션 축소 환경은 선을 움직이지 않고 정적인 당기기 안내만 제공한다", async () => {
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
    const cleanup = await initIntroPull({
      root,
      onDrop: vi.fn(),
      prefersReducedMotion: true,
    });

    expect(root.dataset.pullDemo).toBe("true");
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("372px");
    expect(root.style.getPropertyValue("--intro-pull-y")).toBe("72px");
    expect(pullMocks.loadGsap).not.toHaveBeenCalled();

    root.focus();
    expect(root.dataset.pullDemo).toBeUndefined();
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("300px");
    expect(root.style.getPropertyValue("--intro-pull-y")).toBe("72px");

    cleanup();
  });

  it("오래된 정리 작업이 최신 당김선 상태를 지우지 않는다", async () => {
    document.documentElement.dataset.introReady = "true";
    const root = createPull();
    const firstCleanup = await initIntroPull({
      root,
      onDrop: vi.fn(),
      prefersReducedMotion: true,
    });
    const latestCleanup = await initIntroPull({
      root,
      onDrop: vi.fn(),
      prefersReducedMotion: true,
    });

    firstCleanup();
    expect(root.dataset.pullDemo).toBe("true");
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("372px");

    latestCleanup();
    expect(root.dataset.pullDemo).toBeUndefined();
    expect(root.style.getPropertyValue("--intro-pull-x")).toBe("");
  });
});
