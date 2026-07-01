"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { IntroPhraseTextureOverlay } from "@/components/sections/IntroPhraseTextureOverlay";
import { initIntroAnimation, initIntroScroll } from "@/lib/animation/intro";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";

const INTRO_MASK_PHRASE = "몰입감 있는";
const INTRO_PHRASE_TEXTURE_SRC = "/intro/intro-phrase-texture.mp4";
const INTRO_TEXTURE_READY_FALLBACK_MS = 450;

export const Intro = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const titleShellRef = useRef<HTMLDivElement | null>(null);
  const hasIntroMaskPhrase = portfolio.introHeadline.startsWith(INTRO_MASK_PHRASE);
  const introHeadlineRest = hasIntroMaskPhrase
    ? portfolio.introHeadline.slice(INTRO_MASK_PHRASE.length)
    : "";

  const { prefersReducedMotion } = useScrollRuntime();
  const { register, unregister } = useSectionRegistry();
  const shouldGateTitleTexture = hasIntroMaskPhrase && !prefersReducedMotion;
  const [isTitleTextureReady, setIsTitleTextureReady] = useState(!shouldGateTitleTexture);

  useEffect(() => {
    if (!sectionRef.current) return;

    register("intro", sectionRef);
    return () => unregister("intro");
  }, [register, unregister]);

  useEffect(() => {
    if (!shouldGateTitleTexture) return;

    const fallbackId = window.setTimeout(
      () => setIsTitleTextureReady(true),
      INTRO_TEXTURE_READY_FALLBACK_MS,
    );

    return () => window.clearTimeout(fallbackId);
  }, [shouldGateTitleTexture]);

  const handlePhraseTextureReady = useCallback(() => {
    setIsTitleTextureReady(true);
  }, []);

  // 진입 애니메이션
  useEffect(() => {
    if (!sectionRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initIntroAnimation(sectionRef.current!, prefersReducedMotion);
      if (!alive) {
        d();
        return;
      }
      destroy = d;
    })();

    return () => {
      alive = false;
      destroy?.();
    };
  }, [prefersReducedMotion]);

  // 스크롤 기반 흩어짐/소멸
  useEffect(() => {
    if (!sectionRef.current) return;

    let alive = true;
    let destroy: (() => void) | null = null;

    (async () => {
      const d = await initIntroScroll({
        root: sectionRef.current!,
        heading: headingRef.current,
        prefersReducedMotion,
      });

      if (!alive) {
        d();
        return;
      }
      destroy = d;
    })();

    return () => {
      alive = false;
      destroy?.();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="intro"
      ref={sectionRef}
      tabIndex={-1}
      className="section-padding relative flex min-h-[90vh] items-center overflow-hidden bg-neutral-950 text-white"
      aria-labelledby="intro-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="intro-video-poster absolute inset-0" />
        {!prefersReducedMotion && (
          <video
            className="intro-video-bg absolute inset-0"
            src="/intro/intro-cinematic.mp4"
            poster="/intro/intro-cinematic-poster.png"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-neutral-950/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-neutral-950 to-transparent" />
      </div>

      <Container className="relative max-w-4xl z-10 space-y-8 mt-38">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60" data-intro-item>
          {portfolio.introEyebrow}
        </p>

        <div
          ref={titleShellRef}
          className="intro-title-shell relative"
          data-intro-item
          data-texture-ready={
            !shouldGateTitleTexture || isTitleTextureReady ? "true" : "false"
          }
        >
          <h1
            id="intro-title"
            ref={headingRef}
            className="intro-title text-4xl font-semibold leading-tight md:text-6xl"
          >
            {hasIntroMaskPhrase ? (
              <>
                <span
                  className="intro-title-mask-phrase intro-title-mask-char"
                  data-intro-mask-phrase-anchor
                >
                  {INTRO_MASK_PHRASE}
                </span>
                {introHeadlineRest}
              </>
            ) : (
              portfolio.introHeadline
            )}
          </h1>
          <IntroPhraseTextureOverlay
            disabled={!hasIntroMaskPhrase || prefersReducedMotion}
            headingRef={headingRef}
            hostRef={titleShellRef}
            onReady={handlePhraseTextureReady}
            phrase={INTRO_MASK_PHRASE}
            src={INTRO_PHRASE_TEXTURE_SRC}
          />
        </div>

        <p className="max-w-2xl text-lg text-white/70 md:text-xl" data-intro-item>
          {portfolio.introSubhead}
        </p>

        <div className="flex flex-wrap gap-3" data-intro-item>
          {portfolio.introHighlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
            >
              {item}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
};
