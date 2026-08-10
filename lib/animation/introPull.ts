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

const HOVER_DISTANCE = 38;
const HOVER_PULL = 0.38;
const HOVER_LIMIT = 15;
const VIEWBOX_HEIGHT = 200;
const VIEWBOX_MIDDLE = VIEWBOX_HEIGHT / 2;
const VIEWBOX_WIDTH = 1000;

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

  const gsap = prefersReducedMotion ? null : (await loadGsap()).gsap;
  const initialWidth = root.getBoundingClientRect().width || 600;
  const point: PullPoint = { x: initialWidth / 2, y: 0 };
  let active = false;
  let hovering = false;
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

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
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

    if (!active) {
      const isNear = Math.abs(pointer.y) <= HOVER_DISTANCE;
      if (!isNear) {
        if (hovering) {
          setHover(false);
          resetPull();
        }
        return;
      }

      setState("pull");
      setHover(true);
      movePoint(
        {
          x: pointer.x,
          y: clamp(pointer.y * HOVER_PULL, -HOVER_LIMIT, HOVER_LIMIT),
        },
        0.28,
        "power3.out",
      );
      return;
    }

    if (event.pointerId !== pointerId) return;

    const threshold = readThreshold();
    point.x = pointer.x;
    point.y = clamp(pointer.y, -threshold * 0.4, threshold * 1.65);
    setState(point.y >= threshold ? "drop" : "pull");
    renderPull();
    event.preventDefault();
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
      setHover(false);
      resetPull();
      onDrop();
      return;
    }

    const staysNear = canDrop && Math.abs(pointer.y) <= HOVER_DISTANCE;
    setHover(staysNear);
    resetPull(staysNear ? pointer : undefined);
  };

  const onPointerUp = (event: PointerEvent) => finishPointer(event, true);
  const onPointerCancel = (event: PointerEvent) => finishPointer(event, false);
  const onPointerLeave = () => {
    if (active) return;
    setHover(false);
    resetPull();
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerCancel);
  root.addEventListener("pointerleave", onPointerLeave);
  renderPull();

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerup", onPointerUp);
    root.removeEventListener("pointercancel", onPointerCancel);
    root.removeEventListener("pointerleave", onPointerLeave);
    gsap?.killTweensOf(point);
    delete root.dataset.pullActive;
    delete root.dataset.pullHover;
    delete root.dataset.pullLabelSide;
    root.style.removeProperty("--intro-pull-x");
    root.style.removeProperty("--intro-pull-y");
  };
};
