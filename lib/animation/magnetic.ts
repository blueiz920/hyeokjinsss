import { loadGsap } from "@/lib/gsap/loadGsap";

type MagneticOptions = {
  prefersReducedMotion: boolean;
  root: ParentNode;
};

type MagneticBinding = {
  element: HTMLElement;
  label: HTMLElement | null;
  onLeave: () => void;
  onMove: (event: MouseEvent) => void;
};

const POINTER_QUERY =
  "(min-width: 541px) and (hover: hover) and (pointer: fine)";
const MOVE_EASE = "power4.out";
const RESET_EASE = "elastic.out(1, 0.3)";

const readStrength = (element: HTMLElement, name: string, fallback: number) => {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
};

// 원본의 좌표 비율식을 유지하면서 바깥 컨트롤과 내부 라벨을 서로 다른 세기로 당긴다.
export const initMagneticMotion = async ({
  prefersReducedMotion,
  root,
}: MagneticOptions) => {
  if (typeof window === "undefined" || prefersReducedMotion) return () => {};

  const elements = Array.from(
    root.querySelectorAll<HTMLElement>("[data-magnetic]"),
  );
  if (!elements.length) return () => {};

  const { gsap } = await loadGsap();
  const media = window.matchMedia(POINTER_QUERY);
  let bindings: MagneticBinding[] = [];

  const resetElement = (
    element: HTMLElement,
    label: HTMLElement | null,
    animate: boolean,
  ) => {
    const targets = label ? [element, label] : [element];
    gsap.killTweensOf(targets);

    if (animate) {
      gsap.to(targets, {
        x: 0,
        y: 0,
        rotation: 0.001,
        duration: 1.5,
        ease: RESET_EASE,
        overwrite: "auto",
      });
      return;
    }

    gsap.set(targets, { clearProps: "x,y,rotation" });
  };

  const unbindElements = () => {
    bindings.forEach(({ element, label, onLeave, onMove }) => {
      element.removeEventListener("mousemove", onMove);
      element.removeEventListener("mouseleave", onLeave);
      resetElement(element, label, false);
    });
    bindings = [];
  };

  const bindElements = () => {
    if (bindings.length) return;

    bindings = elements.map((element) => {
      const label = element.querySelector<HTMLElement>(
        "[data-magnetic-label]",
      );
      const strength = readStrength(element, "magneticStrength", 20);
      const labelStrength = readStrength(
        element,
        "magneticLabelStrength",
        strength / 2,
      );

      const onMove = (event: MouseEvent) => {
        const bounds = element.getBoundingClientRect();
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        if (!width || !height) return;

        const xRatio = (event.clientX - bounds.left) / width - 0.5;
        const yRatio = (event.clientY - bounds.top) / height - 0.5;
        const x = xRatio * strength;
        const y = yRatio * strength;

        gsap.to(element, {
          x,
          y,
          rotation: 0.001,
          duration: 1.5,
          ease: MOVE_EASE,
          overwrite: "auto",
        });

        if (!label) return;

        gsap.to(label, {
          x: xRatio * labelStrength,
          y: yRatio * labelStrength,
          rotation: 0.001,
          duration: 1.5,
          ease: MOVE_EASE,
          overwrite: "auto",
        });
      };

      const onLeave = () => resetElement(element, label, true);

      element.addEventListener("mousemove", onMove);
      element.addEventListener("mouseleave", onLeave);

      return { element, label, onLeave, onMove };
    });
  };

  const updateMotion = () => {
    if (media.matches) {
      bindElements();
      return;
    }

    unbindElements();
  };

  media.addEventListener("change", updateMotion);
  updateMotion();

  return () => {
    media.removeEventListener("change", updateMotion);
    unbindElements();
  };
};
