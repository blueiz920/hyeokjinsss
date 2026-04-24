"use client";

import { useState } from "react";
import { portfolio } from "@/data/portfolio";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import { OverlayNav } from "@/components/common/OverlayNav";
import { Container } from "./Container";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { scrollTo } = useSectionRegistry();

  return (
    <header className="fixed left-0 top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-sm">
      <Container className="flex items-center justify-between py-4">
        <button
          type="button"
          onClick={() => scrollTo("intro")}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white"
          aria-label="Scroll to intro"
        >
          {portfolio.name}
        </button>
        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          {portfolio.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="transition hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white md:hidden"
          aria-label="Open navigation"
        >
          Menu
        </button>
      </Container>
      <OverlayNav open={open} onClose={() => setOpen(false)} navItems={portfolio.nav} />
    </header>
  );
};
