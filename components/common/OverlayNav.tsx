"use client";

import { useEffect, useRef } from "react";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import type { NavItem } from "@/data/types";

type NavSocial = {
  label: string;
  href: string;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const isElementVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
};

export const OverlayNav = ({
  open,
  onClose,
  navItems,
  socialItems,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  socialItems: NavSocial[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  const { scrollTo } = useSectionRegistry();
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const restoreFocusElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    triggerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const dialogItems = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(isElementVisible);
      const trigger = triggerRef.current;
      const focusable = trigger ? [trigger, ...dialogItems] : dialogItems;

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (restoreFocusElement?.isConnected) restoreFocusElement.focus();
    };
  }, [open, onClose, triggerRef]);

  const handleClick = (id: string) => {
    onClose();
    requestAnimationFrame(() => scrollTo(id));
  };

  return (
    <div
      data-open={open ? "true" : "false"}
      aria-hidden={!open}
      inert={!open}
      className="group/nav invisible pointer-events-none fixed inset-0 z-50 transition-[visibility] delay-[950ms] duration-0 [--nav-curve-width:20vw] data-[open=true]:visible data-[open=true]:pointer-events-auto data-[open=true]:delay-0 md:[--nav-curve-width:6vw] motion-reduce:delay-0"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 cursor-default bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_20%,rgba(0,0,0,0.78)_100%)] opacity-0 transition-opacity duration-[450ms] [transition-timing-function:cubic-bezier(0.7,0,0.2,1)] group-data-[open=true]/nav:opacity-100 motion-reduce:duration-0"
        onPointerDown={onClose}
      />

      <aside
        id="site-navigation"
        ref={dialogRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-labelledby="site-nav-title"
        tabIndex={-1}
        data-nav-drawer
        className="fixed right-0 top-0 z-[51] h-[100svh] w-full bg-[#181715] text-[#f3ede3] [transform:translate(calc(100%+var(--nav-curve-width)),0)_rotate(0.001deg)] transition-transform duration-[800ms] [transition-timing-function:cubic-bezier(0.7,0,0.2,1)] [will-change:transform] group-data-[open=true]/nav:[transform:translate(0,0)_rotate(0.001deg)] md:w-[min(42rem,44vw)] motion-reduce:duration-0"
      >
        <div
          aria-hidden="true"
          className="absolute left-px top-0 h-full [transform:translateX(-100%)]"
        >
          <div
            data-nav-curve
            className="relative h-full w-[var(--nav-curve-width)] overflow-hidden transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.7,0,0.2,1)] [will-change:width] group-data-[open=true]/nav:w-0 motion-reduce:duration-0"
          >
            <div className="absolute left-1/2 top-1/2 z-[1] block h-[150%] w-[775%] rounded-[50%] bg-[#181715] [transform:translate(-6.5%,-50%)]" />
          </div>
        </div>

        <div className="flex h-full flex-col px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 md:px-[clamp(3rem,6vw,6.5rem)] md:pb-[8vh] md:pt-[7vh]">
          <div className="flex min-h-14 items-center border-b border-white/15 pb-7 pr-20 sm:min-h-16 sm:pb-9 sm:pr-24">
            <p
              id="site-nav-title"
              className="text-[0.68rem] uppercase tracking-[0.34em] text-white/45"
            >
              Navigation
            </p>
          </div>

          <nav
            aria-label="Primary navigation"
            className="flex min-h-0 flex-1 items-center py-8 sm:py-10"
          >
            <ul className="w-full">
              {navItems.map((item) => (
                <li
                  key={item.id}
                  className="nav-menu-item motion-reduce:duration-0 motion-reduce:delay-0"
                >
                  <button
                    type="button"
                    onClick={() => handleClick(item.id)}
                    className="group flex w-full items-center justify-between py-1 text-left text-[clamp(2.6rem,10vw,4.4rem)] font-medium leading-[1.17] tracking-[-0.045em] text-[#f3ede3] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 md:text-[clamp(3.4rem,5vw,5.2rem)]"
                  >
                    <span
                      data-magnetic
                      data-magnetic-strength="24"
                      data-magnetic-label-strength="12"
                      className="inline-flex"
                    >
                      <span data-magnetic-label>{item.label}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="size-2.5 scale-0 rounded-full bg-amber-500 opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-end justify-between gap-6 border-t border-white/15 pt-6">
            <div>
              <p className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-white/35">
                Connect
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
                {socialItems.map((social) => {
                  const isExternalLink = social.href.startsWith("http");

                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target={isExternalLink ? "_blank" : undefined}
                        rel={
                          isExternalLink ? "noopener noreferrer" : undefined
                        }
                        data-magnetic
                        data-magnetic-strength="20"
                        data-magnetic-label-strength="10"
                        className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
                      >
                        <span data-magnetic-label>{social.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <span
              aria-hidden="true"
              className="mb-1 block h-px w-10 bg-amber-500"
            />
          </div>
        </div>
      </aside>
    </div>
  );
};
