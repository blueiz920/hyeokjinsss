"use client";

import { useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import type { RefObject } from "react";

const CARD_OPACITY_POINTS = [0, 0.3, 0.7, 1];
const CARD_Y_POINTS = [0, 0.3, 0.7, 1];
const CARD_SCALE_POINTS = [0.2, 0.4, 0.6, 0.8];

const CARD_OPACITY_RANGE = [0.4, 1, 1, 0.4];
const CARD_Y_RANGE = [88, 0, 0, -88];
const CARD_SCALE_RANGE = [0.96, 1, 1, 0.96];
const IMAGE_Y_RANGE = [-12, 12];

const STATIC_CARD_RANGE = [1, 1, 1, 1];
const STATIC_Y_RANGE = [0, 0, 0, 0];
const STATIC_IMAGE_Y_RANGE = [0, 0];

export const getProjectCardIndex = (cards: HTMLElement[]) => {
  const viewportCenter = window.innerHeight / 2;

  return cards.reduce(
    (closest, card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index;
};

export const useProjectCardMotion = (
  targetRef: RefObject<HTMLElement | null>,
  prefersReducedMotion: boolean,
) => {
  const [motionReady, setMotionReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    CARD_OPACITY_POINTS,
    prefersReducedMotion ? STATIC_CARD_RANGE : CARD_OPACITY_RANGE,
  );
  const y = useTransform(
    scrollYProgress,
    CARD_Y_POINTS,
    prefersReducedMotion ? STATIC_Y_RANGE : CARD_Y_RANGE,
  );
  const scale = useTransform(
    scrollYProgress,
    CARD_SCALE_POINTS,
    prefersReducedMotion ? STATIC_CARD_RANGE : CARD_SCALE_RANGE,
  );
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? STATIC_IMAGE_Y_RANGE : IMAGE_Y_RANGE,
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = requestAnimationFrame(() => setMotionReady(true));

    return () => cancelAnimationFrame(id);
  }, [prefersReducedMotion]);

  const enabled = motionReady && !prefersReducedMotion;

  return {
    enabled,
    cardStyle: enabled ? { opacity, y, scale } : undefined,
    imageStyle: enabled ? { y: imageY } : undefined,
  };
};
