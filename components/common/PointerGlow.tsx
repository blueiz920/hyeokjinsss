"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";

const OFFSCREEN_POSITION = -9999;

export const PointerGlow = () => {
  const { prefersReducedMotion } = useScrollRuntime();
  const pointerX = useMotionValue(OFFSCREEN_POSITION);
  const pointerY = useMotionValue(OFFSCREEN_POSITION);
  const x = useSpring(pointerX, { stiffness: 90, damping: 28, mass: 0.45 });
  const y = useSpring(pointerY, { stiffness: 90, damping: 28, mass: 0.45 });

  useEffect(() => {
    if (prefersReducedMotion) {
      pointerX.set(OFFSCREEN_POSITION);
      pointerY.set(OFFSCREEN_POSITION);
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    // 좌표는 MotionValue에만 넣어서 마우스 이동마다 React 렌더를 만들지 않아요.
    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };

    const handlePointerLeave = () => {
      pointerX.set(OFFSCREEN_POSITION);
      pointerY.set(OFFSCREEN_POSITION);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [pointerX, pointerY, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
  <motion.div
    aria-hidden="true"
    className="pointer-events-none fixed left-0 top-0 z-30 hidden h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,236,196,0.18)_0%,rgba(245,166,70,0.13)_34%,rgba(180,104,32,0.08)_55%,transparent_72%)] opacity-[0.34] blur-2xl mix-blend-screen will-change-transform md:block"
    style={{ x, y }}
  />
);
};
