import { loadGsap } from "@/lib/gsap/loadGsap";

type IntroPullOptions = {
  root: HTMLButtonElement;
  onDrop: () => void;
  prefersReducedMotion: boolean;
};

type PullPoint = {
  x: number;
  y: number;
};

type PullState = "drop" | "pull";

const AWARE_DISTANCE = 180;
const CUE_DELAY = 800;
const CUE_END_DELAY = 1350;
const CUE_PULL = 10;
const CUE_REPEAT_DELAY = 4150;
const CUE_RETURN_DELAY = 520;
const CUE_X_RATIO = 0.62;
const HINT_DISTANCE = 90;
const HOVER_DISTANCE = 38;
const HOVER_PULL = 0.38;
const HOVER_LIMIT = 15;
const VIEWBOX_HEIGHT = 200;
const VIEWBOX_MIDDLE = VIEWBOX_HEIGHT / 2;
const VIEWBOX_WIDTH = 1000;
const pullInstances = new WeakMap<HTMLButtonElement, object>();

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const initIntroPull = async ({
  root,
  onDrop,
  prefersReducedMotion,
}: IntroPullOptions) => {
  const line = root.querySelector<SVGPathElement>("[data-pull-line]");
  const hit = root.querySelector<SVGPathElement>("[data-pull-hit]");
  const label = root.querySelector<HTMLElement>("[data-pull-label]");
  const status = root.querySelector<HTMLElement>("[data-pull-status]");

  if (!line || !hit || !label || !status) return () => {};

  const instance = {};
  pullInstances.set(root, instance);

  const gsap = prefersReducedMotion ? null : (await loadGsap()).gsap;
  const initialWidth = root.getBoundingClientRect().width || 600;
  const point: PullPoint = { x: initialWidth / 2, y: 0 };
  let active = false;
  let aware = false;
  let cueCount = 0;
  let cueEndTimer = 0;
  let cueReturnTimer = 0;
  let cueTimer = 0;
  let cueStarted = false;
  let hasInteracted = false;
  let hovering = false;
  let introObserver: MutationObserver | null = null;
  let lastScrollY = window.scrollY;
  let pointerId = -1;
  let state: PullState = "pull";

  const readPointer = (event: PointerEvent) => {
    const bounds = root.getBoundingClientRect();
    const width = bounds.width || 600;
    const height = bounds.height || 144;

    return {
      height,
      width,
      x: clamp(event.clientX - bounds.left, 0, width),
      y: event.clientY - bounds.top - height / 2,
    };
  };

  const readThreshold = () => {
    const height = root.getBoundingClientRect().height || 144;
    return Math.max(52, Math.min(80, height * 0.45));
  };

  const renderPull = () => {
    const bounds = root.getBoundingClientRect();
    const width = bounds.width || 600;
    const height = bounds.height || 144;
    const contactX = clamp((point.x / width) * VIEWBOX_WIDTH, 18, 982);
    const contactY =
      VIEWBOX_MIDDLE + (point.y / height) * VIEWBOX_HEIGHT;
    const leftFirst = contactX * 0.45;
    const leftSecond = contactX * 0.78;
    const rightFirst = contactX + (VIEWBOX_WIDTH - contactX) * 0.22;
    const rightSecond = contactX + (VIEWBOX_WIDTH - contactX) * 0.55;
    const path = `M0 ${VIEWBOX_MIDDLE} C${leftFirst} ${VIEWBOX_MIDDLE} ${leftSecond} ${contactY} ${contactX} ${contactY} C${rightFirst} ${contactY} ${rightSecond} ${VIEWBOX_MIDDLE} ${VIEWBOX_WIDTH} ${VIEWBOX_MIDDLE}`;

    line.setAttribute("d", path);
    hit.setAttribute("d", path);
    root.style.setProperty("--intro-pull-x", `${point.x}px`);
    root.style.setProperty(
      "--intro-pull-y",
      `${height / 2 + point.y}px`,
    );
    root.dataset.pullLabelSide = point.x > width - 96 ? "left" : "right";
  };

  const setState = (nextState: PullState) => {
    if (state === nextState) return;

    state = nextState;
    root.dataset.pullState = nextState;
    label.textContent = nextState === "drop" ? "DROP!" : "PULL!";
    status.textContent =
      nextState === "drop"
        ? "지금 놓으면 프로젝트로 이동합니다."
        : "선을 아래로 당기세요.";
  };

  const setHover = (isHovering: boolean) => {
    if (hovering === isHovering) return;

    hovering = isHovering;
    if (isHovering) {
      root.dataset.pullHover = "true";
      return;
    }

    delete root.dataset.pullHover;
  };

  const setAwareness = (strength: number) => {
    aware = strength > 0;

    if (aware) {
      root.dataset.pullAware = "true";
      root.style.setProperty(
        "--intro-pull-awareness",
        strength.toFixed(3),
      );
      return;
    }

    delete root.dataset.pullAware;
    root.style.removeProperty("--intro-pull-awareness");
  };

  const movePoint = (
    target: PullPoint,
    duration: number,
    ease: string,
  ) => {
    gsap?.killTweensOf(point);

    if (!gsap || prefersReducedMotion) {
      point.x = target.x;
      point.y = target.y;
      renderPull();
      return;
    }

    gsap.to(point, {
      x: target.x,
      y: target.y,
      duration,
      ease,
      overwrite: "auto",
      onUpdate: renderPull,
    });
  };

  const resetPull = (
    pointer?: ReturnType<typeof readPointer>,
  ) => {
    setState("pull");
    const bounds = root.getBoundingClientRect();
    const width = bounds.width || 600;
    const target = pointer
      ? {
          x: pointer.x,
          y: clamp(pointer.y * HOVER_PULL, -HOVER_LIMIT, HOVER_LIMIT),
        }
      : { x: width / 2, y: 0 };

    movePoint(target, pointer ? 0.38 : 0.8, "elastic.out(1, 0.35)");
  };

  const clearCueTimers = () => {
    window.clearTimeout(cueTimer);
    window.clearTimeout(cueReturnTimer);
    window.clearTimeout(cueEndTimer);
    cueTimer = 0;
    cueReturnTimer = 0;
    cueEndTimer = 0;
  };

  const stopCue = (resetPoint = false) => {
    hasInteracted = true;
    clearCueTimers();
    const wasRunning = root.dataset.pullDemo === "true";
    delete root.dataset.pullDemo;

    if (wasRunning && resetPoint && !active) resetPull();
  };

  const isCueVisible = () => {
    const bounds = root.getBoundingClientRect();
    return (
      document.visibilityState !== "hidden" &&
      bounds.bottom > 0 &&
      bounds.top < window.innerHeight
    );
  };

  const runCue = () => {
    cueTimer = 0;
    if (hasInteracted || active || !isCueVisible()) return;

    cueCount += 1;
    const width = root.getBoundingClientRect().width || 600;
    root.dataset.pullDemo = "true";
    setState("pull");
    movePoint(
      { x: width * CUE_X_RATIO, y: CUE_PULL },
      0.36,
      "power3.out",
    );

    cueReturnTimer = window.setTimeout(() => {
      cueReturnTimer = 0;
      movePoint(
        { x: width / 2, y: 0 },
        0.82,
        "elastic.out(1, 0.35)",
      );
    }, CUE_RETURN_DELAY);

    cueEndTimer = window.setTimeout(() => {
      cueEndTimer = 0;
      delete root.dataset.pullDemo;
      if (cueCount < 2 && !hasInteracted) {
        cueTimer = window.setTimeout(runCue, CUE_REPEAT_DELAY);
      }
    }, CUE_END_DELAY);
  };

  const startCue = () => {
    if (cueStarted || hasInteracted) return;

    cueStarted = true;
    introObserver?.disconnect();
    introObserver = null;

    if (prefersReducedMotion) {
      const width = root.getBoundingClientRect().width || 600;
      point.x = width * CUE_X_RATIO;
      point.y = 0;
      root.dataset.pullDemo = "true";
      renderPull();
      return;
    }

    cueTimer = window.setTimeout(runCue, CUE_DELAY);
  };

  const isIntroReady = () =>
    document.documentElement.dataset.introReady === "true" &&
    document.documentElement.dataset.introEntering !== "true";

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopCue();
    if (!hovering && event.target !== hit) return;

    const pointer = readPointer(event);
    active = true;
    pointerId = event.pointerId;
    gsap?.killTweensOf(point);
    point.x = pointer.x;
    point.y = pointer.y;
    setHover(true);
    root.dataset.pullActive = "true";
    root.setPointerCapture?.(pointerId);
    renderPull();
  };

  const onPointerMove = (event: PointerEvent) => {
    const pointer = readPointer(event);

    if (active) {
      if (event.pointerId !== pointerId) return;

      const threshold = readThreshold();
      point.x = pointer.x;
      point.y = clamp(pointer.y, -threshold * 0.4, threshold * 1.65);
      setState(point.y >= threshold ? "drop" : "pull");
      renderPull();
      event.preventDefault();
      return;
    }

    if (event.pointerType === "touch") return;

    const bounds = root.getBoundingClientRect();
    const withinX =
      event.clientX >= bounds.left && event.clientX <= bounds.right;
    const distance = Math.abs(pointer.y);
    const isAware = withinX && distance <= AWARE_DISTANCE;

    if (!isAware) {
      if (aware || hovering) {
        setAwareness(0);
        setHover(false);
        resetPull();
      }
      return;
    }

    stopCue();
    const isNear = distance <= HOVER_DISTANCE;
    const pullStrength = clamp(
      (AWARE_DISTANCE - distance) /
        (AWARE_DISTANCE - HOVER_DISTANCE),
      0,
      1,
    );
    const hintStrength = isNear
      ? 1
      : clamp(
          (HINT_DISTANCE - distance) /
            (HINT_DISTANCE - HOVER_DISTANCE),
          0,
          1,
        );
    const pullY = isNear
      ? clamp(pointer.y * HOVER_PULL, -HOVER_LIMIT, HOVER_LIMIT)
      : Math.sign(pointer.y) *
        HOVER_LIMIT *
        Math.pow(pullStrength, 1.8);

    setState("pull");
    setAwareness(Math.max(hintStrength, 0.001));
    setHover(isNear);
    movePoint(
      { x: pointer.x, y: pullY },
      0.32,
      "power3.out",
    );
  };

  const finishPointer = (event: PointerEvent, canDrop: boolean) => {
    if (!active || event.pointerId !== pointerId) return;

    const pointer = readPointer(event);
    const shouldDrop = canDrop && state === "drop";
    active = false;
    delete root.dataset.pullActive;
    if (root.hasPointerCapture?.(pointerId)) {
      root.releasePointerCapture(pointerId);
    }

    if (shouldDrop) {
      setAwareness(0);
      setHover(false);
      resetPull();
      onDrop();
      return;
    }

    const staysNear = canDrop && Math.abs(pointer.y) <= HOVER_DISTANCE;
    setAwareness(staysNear ? 1 : 0);
    setHover(staysNear);
    resetPull(staysNear ? pointer : undefined);
  };

  const onPointerUp = (event: PointerEvent) => finishPointer(event, true);
  const onPointerCancel = (event: PointerEvent) => finishPointer(event, false);
  const onPointerOut = (event: PointerEvent) => {
    if (active || event.relatedTarget) return;
    setAwareness(0);
    setHover(false);
    resetPull();
  };
  const onFocus = () => stopCue(true);
  const onScroll = () => {
    const nextScrollY = window.scrollY;
    if (Math.abs(nextScrollY - lastScrollY) < 1) return;

    lastScrollY = nextScrollY;
    stopCue(true);
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerCancel);
  root.addEventListener("focus", onFocus);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerout", onPointerOut);
  window.addEventListener("scroll", onScroll, { passive: true });
  renderPull();

  if (isIntroReady()) {
    startCue();
  } else {
    introObserver = new MutationObserver(() => {
      if (isIntroReady()) startCue();
    });
    introObserver.observe(document.documentElement, {
      attributeFilter: ["data-intro-ready", "data-intro-entering"],
      attributes: true,
    });
  }

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointerup", onPointerUp);
    root.removeEventListener("pointercancel", onPointerCancel);
    root.removeEventListener("focus", onFocus);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerout", onPointerOut);
    window.removeEventListener("scroll", onScroll);
    introObserver?.disconnect();
    clearCueTimers();
    gsap?.killTweensOf(point);
    if (pullInstances.get(root) !== instance) return;

    pullInstances.delete(root);
    delete root.dataset.pullActive;
    delete root.dataset.pullAware;
    delete root.dataset.pullDemo;
    delete root.dataset.pullHover;
    delete root.dataset.pullLabelSide;
    root.style.removeProperty("--intro-pull-x");
    root.style.removeProperty("--intro-pull-y");
    root.style.removeProperty("--intro-pull-awareness");
  };
};
