"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { IntroTextureOverlay } from "@/components/sections/IntroTextureOverlay";
import { initIntroAnimation, initIntroScroll } from "@/lib/animation/intro";
import { waitIntroReady } from "@/lib/animation/introLoader";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";

const INTRO_MASK_PHRASE = "몰입감 있는";
const INTRO_PHRASE_TEXTURE_SRC = "/intro/intro-phrase-texture.mp4";
const INTRO_ENTRY_FALLBACK_MS = 1800;
const INTRO_TEXTURE_READY_FALLBACK_MS = 450;

export const Intro = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const titleShellRef = useRef<HTMLDivElement | null>(null);
  const hasIntroMaskPhrase = portfolio.introHeadline.startsWith(INTRO_MASK_PHRASE);
  const introHeadlineRest = hasIntroMaskPhrase
    ? portfolio.introHeadline.slice(INTRO_MASK_PHRASE.length)
    : "";

  const { lockScroll, prefersReducedMotion, unlockScroll } = useScrollRuntime();
  const { register, unregister, scrollTo } = useSectionRegistry();
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

  // 로더 이후 진입 장면을 마친 뒤 스크롤 소멸을 연결해 같은 속성의 경합을 막는다.
  useEffect(() => {
    if (!sectionRef.current) return;

    const root = sectionRef.current;
    let alive = true;
    let introDestroy: (() => void) | null = null;
    let scrollDestroy: (() => void) | null = null;
    let entryTimer = 0;
    let isEntering = false;
    let isLeaving = false;
    let ownsLock = false;
    let scrollStarted = false;

    const unlockIntro = () => {
      if (entryTimer) {
        window.clearTimeout(entryTimer);
        entryTimer = 0;
      }
      if (!ownsLock) return;

      ownsLock = false;
      unlockScroll();
      delete document.documentElement.dataset.introEntering;
    };

    const startScroll = () => {
      if (!alive || scrollStarted) return;

      scrollStarted = true;
      void (async () => {
        try {
          const dispose = await initIntroScroll({
            root,
            heading: headingRef.current,
            prefersReducedMotion,
          });
          if (!alive) {
            dispose();
            return;
          }
          scrollDestroy = dispose;
        } catch (error) {
          if (alive) console.error("Intro scroll motion failed.", error);
        }
      })();
    };

    const finishIntro = () => {
      isEntering = false;
      if (!isLeaving) delete root.dataset.introEntryMuted;
      unlockIntro();
      startScroll();
    };

    const lockIntro = () => {
      if (prefersReducedMotion || ownsLock) return;

      ownsLock = true;
      lockScroll();
      document.documentElement.dataset.introEntering = "true";
      entryTimer = window.setTimeout(finishIntro, INTRO_ENTRY_FALLBACK_MS);
    };

    const startIntro = () => {
      isEntering = true;
      lockIntro();
      void (async () => {
        try {
          const dispose = await initIntroAnimation(
            root,
            prefersReducedMotion,
            finishIntro,
          );
          if (!alive) {
            dispose();
            return;
          }
          introDestroy = dispose;
        } catch (error) {
          if (!alive) return;
          console.error("Intro entry motion failed.", error);
          finishIntro();
        }
      })();
    };

    const handleIntent = (event: Event) => {
      const { id, phase } = (event as CustomEvent<SectionIntentDetail>).detail;

      if (phase === "end" && id !== "intro" && isLeaving) {
        isLeaving = false;
        delete root.dataset.introEntryMuted;
        return;
      }

      if (phase === "start" && id === "intro") {
        isLeaving = false;
        delete root.dataset.introEntryMuted;
        return;
      }

      if (id === "intro" || !isEntering) return;

      if (phase === "start") {
        isLeaving = true;
        root.dataset.introEntryMuted = "true";
        unlockIntro();
      }
    };

    document.addEventListener(SECTION_INTENT_EVENT, handleIntent);
    const stopWaiting = waitIntroReady(startIntro);

    return () => {
      alive = false;
      document.removeEventListener(SECTION_INTENT_EVENT, handleIntent);
      stopWaiting();
      introDestroy?.();
      scrollDestroy?.();
      unlockIntro();
      delete root.dataset.introEntryMuted;
    };
  }, [lockScroll, prefersReducedMotion, unlockScroll]);

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
          <IntroTextureOverlay
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
          <button
            type="button"
            onClick={() => scrollTo("projects")}
            data-magnetic
            data-magnetic-strength="25"
            data-magnetic-label-strength="15"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/90"
          >
            <span data-magnetic-label>프로젝트 보기</span>
          </button>
          <a
            href={`mailto:${portfolio.contactEmail}`}
            data-magnetic
            data-magnetic-strength="25"
            data-magnetic-label-strength="15"
            className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60"
          >
            <span data-magnetic-label>연락하기</span>
          </a>
        </div>

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
