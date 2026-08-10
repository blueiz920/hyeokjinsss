import { loadGsap } from "@/lib/gsap/loadGsap";

type IntroPullOptions = {
  root: HTMLButtonElement;
  onDrop: () => void;
  prefersReducedMotion: boolean;
};

type PullState = "drop" | "pull";

const DRAG_SLOP = 6;
const VIEWBOX_HEIGHT = 200;
const VIEWBOX_MIDDLE = VIEWBOX_HEIGHT / 2;

const readPointer = (event: PointerEvent) => event.clientY;

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
  const point = { y: 0 };
  let active = false;
  let moved = false;
  let pointerId = -1;
  let startY = 0;
  let state: PullState = "pull";
  let clickTimer = 0;

  const readThreshold = () => {
    const height = root.getBoundingClientRect().height || 144;
    return Math.max(52, Math.min(80, height * 0.45));
  };

  const renderPull = () => {
    const height = root.getBoundingClientRect().height || 144;
    const curveY = VIEWBOX_MIDDLE + (point.y / height) * VIEWBOX_HEIGHT;
    const path = `M0 ${VIEWBOX_MIDDLE} Q500 ${curveY} 1000 ${VIEWBOX_MIDDLE}`;

    line.setAttribute("d", path);
    hit.setAttribute("d", path);
    root.style.setProperty("--intro-pull-y", `${point.y}px`);
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

  const resetPull = () => {
    setState("pull");
    gsap?.killTweensOf(point);

    if (!gsap || prefersReducedMotion) {
      point.y = 0;
      renderPull();
      return;
    }

    gsap.to(point, {
      y: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.35)",
      overwrite: "auto",
      onUpdate: renderPull,
    });
  };

  const suppressClick = () => {
    root.dataset.pullSuppressClick = "true";
    if (clickTimer) window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      delete root.dataset.pullSuppressClick;
      clickTimer = 0;
    });
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target !== hit) return;

    active = true;
    moved = false;
    pointerId = event.pointerId;
    startY = readPointer(event);
    gsap?.killTweensOf(point);
    root.dataset.pullActive = "true";
    root.setPointerCapture?.(pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!active || event.pointerId !== pointerId) return;

    const threshold = readThreshold();
    const distance = readPointer(event) - startY;
    moved = moved || Math.abs(distance) > DRAG_SLOP;
    point.y = Math.max(0, Math.min(distance, threshold * 1.65));
    setState(point.y >= threshold ? "drop" : "pull");
    renderPull();
    event.preventDefault();
  };

  const finishPointer = (event: PointerEvent, canDrop: boolean) => {
    if (!active || event.pointerId !== pointerId) return;

    active = false;
    delete root.dataset.pullActive;
    if (root.hasPointerCapture?.(pointerId)) {
      root.releasePointerCapture(pointerId);
    }

    const shouldDrop = canDrop && state === "drop";
    if (moved) suppressClick();
    resetPull();
    if (shouldDrop) onDrop();
  };

  const onPointerUp = (event: PointerEvent) => finishPointer(event, true);
  const onPointerCancel = (event: PointerEvent) => finishPointer(event, false);

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerCancel);
  renderPull();

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerup", onPointerUp);
    root.removeEventListener("pointercancel", onPointerCancel);
    gsap?.killTweensOf(point);
    if (clickTimer) window.clearTimeout(clickTimer);
    delete root.dataset.pullActive;
    delete root.dataset.pullSuppressClick;
    root.style.removeProperty("--intro-pull-y");
  };
};
