"use client";

import { useEffect, useRef } from "react";
import { initIntroPull } from "@/lib/animation/introPull";

type IntroPullProps = {
  onActivate: () => void;
  prefersReducedMotion: boolean;
};

export const IntroPull = ({
  onActivate,
  prefersReducedMotion,
}: IntroPullProps) => {
  const pullRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!pullRef.current) return;

    let isActive = true;
    let disposePull: (() => void) | null = null;

    void initIntroPull({
      root: pullRef.current,
      onDrop: onActivate,
      prefersReducedMotion,
    })
      .then((dispose) => {
        if (!isActive) {
          dispose();
          return;
        }

        disposePull = dispose;
      })
      .catch((error) => {
        if (!isActive) return;
        console.error(
          "Intro pull interaction failed; using the button fallback.",
          error,
        );
      });

    return () => {
      isActive = false;
      disposePull?.();
    };
  }, [onActivate, prefersReducedMotion]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.dataset.pullSuppressClick === "true") {
      event.preventDefault();
      delete event.currentTarget.dataset.pullSuppressClick;
      return;
    }

    onActivate();
  };

  return (
    <div className="intro-pull-stage" data-intro-item>
      <button
        ref={pullRef}
        type="button"
        className="intro-pull"
        aria-label="프로젝트 보기"
        aria-describedby="intro-pull-instructions intro-pull-status"
        data-pull-state="pull"
        onClick={handleClick}
      >
        <span id="intro-pull-instructions" className="sr-only">
          선을 아래로 당겼다가 놓거나 버튼을 선택하면 프로젝트로 이동합니다.
        </span>
        <svg
          className="intro-pull-line"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            data-pull-line
            d="M0 100 Q500 100 1000 100"
            vectorEffect="non-scaling-stroke"
          />
          <path
            data-pull-hit
            d="M0 100 Q500 100 1000 100"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span className="intro-pull-point" data-pull-point aria-hidden="true">
          <span className="intro-pull-dot" />
          <span className="intro-pull-label" data-pull-label>
            PULL!
          </span>
        </span>
        <span
          id="intro-pull-status"
          className="sr-only"
          aria-live="polite"
          data-pull-status
        >
          선을 아래로 당기세요.
        </span>
      </button>
    </div>
  );
};
