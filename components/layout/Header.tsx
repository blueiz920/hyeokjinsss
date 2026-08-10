"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { OverlayNav } from "@/components/common/OverlayNav";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const circleRef = useRef<HTMLButtonElement | null>(null);
  const { scrollTo } = useSectionRegistry();
  const isTriggerVisible = open || hasScrolled;

  useEffect(() => {
    let frameId: number | null = null;

    const updateTrigger = () => {
      frameId = null;
      setHasScrolled(window.scrollY > window.innerHeight * 0.3);
    };

    const queueUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateTrigger);
    };

    updateTrigger();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((current) => !current), []);

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-40 w-full text-[#181715]">
        <div className="flex min-h-[5.75rem] items-center justify-between px-6 py-6 min-[541px]:min-h-0 min-[541px]:px-[clamp(1.5rem,3vw,2.7rem)] min-[541px]:py-[clamp(1.35rem,2vw,1.8rem)]">
          <button
            type="button"
            onClick={() => scrollTo("intro")}
            data-magnetic
            data-magnetic-strength="20"
            data-magnetic-label-strength="10"
            className="text-sm font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
            aria-label="Scroll to intro"
          >
            <span data-magnetic-label>{portfolio.name}</span>
          </button>

          <nav
            aria-label="Intro navigation"
            className="hidden items-center gap-[clamp(1.75rem,3vw,3.5rem)] min-[541px]:flex"
          >
            {portfolio.nav
              .filter((item) => item.id !== "intro")
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  data-magnetic
                  data-magnetic-strength="20"
                  data-magnetic-label-strength="10"
                  className="relative py-2 text-sm font-medium transition-opacity after:absolute after:-bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:scale-0 after:rounded-full after:bg-amber-500 after:transition-transform hover:opacity-75 hover:after:scale-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600 focus-visible:after:scale-100"
                >
                  <span data-magnetic-label>{item.label}</span>
                </button>
              ))}
          </nav>

          <button
            type="button"
            onClick={openMenu}
            className="group inline-flex min-h-11 items-center gap-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600 min-[541px]:hidden"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="site-navigation"
          >
            <span>Menu</span>
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-amber-500 transition-transform duration-300 group-hover:scale-150"
            />
          </button>
        </div>
      </header>

      <div
        data-magnetic
        data-magnetic-strength="50"
        data-magnetic-label-strength="25"
        className={`fixed right-[clamp(1rem,2vw,1.8rem)] top-[clamp(1rem,2vw,1.8rem)] z-[60] size-[clamp(4rem,5.5vw,5rem)] ${
          isTriggerVisible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          ref={circleRef}
          type="button"
          onClick={toggleMenu}
          tabIndex={isTriggerVisible ? 0 : -1}
          aria-hidden={!isTriggerVisible}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="site-navigation"
          data-nav-trigger
          data-open={open ? "true" : "false"}
          data-visible={isTriggerVisible ? "true" : "false"}
          className={`nav-trigger group size-full overflow-hidden rounded-full rotate-[0.001deg] transition-transform duration-[400ms] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 motion-reduce:duration-0 ${
            isTriggerVisible
              ? "pointer-events-auto scale-100 [transition-timing-function:cubic-bezier(0.34,1.5,0.64,1)]"
              : "pointer-events-none scale-0 [transition-timing-function:cubic-bezier(0.36,0,0.66,0)]"
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#f3ede3]"
          />
          <span
            aria-hidden="true"
            className={`nav-trigger-fill absolute inset-0 rounded-full bg-amber-500 motion-reduce:duration-0 ${
              open
                ? "translate-y-0"
                : "translate-y-[105%] group-hover:translate-y-0 group-focus-visible:translate-y-0"
            }`}
          />
          <span
            aria-hidden="true"
            data-magnetic-label
            className="nav-trigger-bars absolute left-1/2 top-1/2 h-[8%] w-[35%] -translate-x-1/2 -translate-y-1/2 min-[541px]:w-[30.5%]"
          >
            <span className="nav-trigger-line motion-reduce:duration-0" />
            <span className="nav-trigger-line motion-reduce:duration-0" />
          </span>
        </button>
      </div>

      <OverlayNav
        open={open}
        onClose={closeMenu}
        navItems={portfolio.nav}
        socialItems={portfolio.socials}
        triggerRef={circleRef}
      />
    </>
  );
};
