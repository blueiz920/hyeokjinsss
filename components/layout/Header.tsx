"use client";

import { useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { OverlayNav } from "@/components/common/OverlayNav";
import { Container } from "./Container";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const { scrollTo } = useSectionRegistry();

  return (
    <header className="fixed left-0 top-0 z-40 w-full bg-gradient-to-b from-black/55 via-black/25 to-transparent">
      <Container className="flex items-center justify-between py-5 md:py-6">
        <button
          type="button"
          onClick={() => scrollTo("intro")}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          aria-label="Scroll to intro"
        >
          {portfolio.name}
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
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
      </Container>
      <OverlayNav
        open={open}
        onClose={() => setOpen(false)}
        navItems={portfolio.nav}
        socialItems={portfolio.socials}
        restoreFocusRef={menuButtonRef}
      />
    </header>
  );
};
