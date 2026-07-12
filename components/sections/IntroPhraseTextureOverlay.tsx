"use client";

import { type CSSProperties, type RefObject } from "react";
import { useIntroPhraseMask } from "@/hooks/useIntroPhraseMask";

type IntroPhraseTextureOverlayProps = {
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  hostRef: RefObject<HTMLElement | null>;
  onReady?: () => void;
  phrase: string;
  src: string;
};

export const IntroPhraseTextureOverlay = ({
  disabled,
  headingRef,
  hostRef,
  onReady,
  phrase,
  src,
}: IntroPhraseTextureOverlayProps) => {
  const { isDesktopLike, maskState } = useIntroPhraseMask({
    disabled,
    headingRef,
    hostRef,
    onReady,
    phrase,
  });

  if (disabled) {
    return null;
  }

  const maskStyle = maskState
    ? ({
        height: maskState.height,
        maskImage: maskState.maskImage,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "100% 100%",
        left: maskState.left,
        top: maskState.top,
        WebkitMaskImage: maskState.maskImage,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        width: maskState.width,
      } satisfies CSSProperties)
    : null;

  return (
    <span
      aria-hidden="true"
      className="intro-phrase-texture-layer"
      data-intro-phrase-texture
      style={maskStyle ?? undefined}
    >
      {isDesktopLike && maskStyle ? (
        <video
          autoPlay
          className={
            process.env.NODE_ENV === "development"
              ? "intro-phrase-texture-overlay intro-phrase-texture-overlay--debug"
              : "intro-phrase-texture-overlay"
          }
          loop
          muted
          playsInline
          preload="auto"
          src={src}
        />
      ) : null}
    </span>
  );
};
