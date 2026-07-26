"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import type { NavItem } from "@/data/types";

type NavSocial = {
  label: string;
  href: string;
};

const DRAWER_EASE = [0.7, 0, 0.2, 1] as [
  number,
  number,
  number,
  number,
];

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const OverlayNav = ({
  open,
  onClose,
  navItems,
  socialItems,
  restoreFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  socialItems: NavSocial[];
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { scrollTo } = useSectionRegistry();
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerDuration = prefersReducedMotion ? 0 : 0.8;
  const curveDuration = prefersReducedMotion ? 0 : 0.85;
  const itemDuration = prefersReducedMotion ? 0 : 0.8;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const restoreFocusElement = restoreFocusRef?.current;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

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
      restoreFocusElement?.focus();
    };
  }, [open, onClose, restoreFocusRef]);

  const handleClick = (id: string) => {
    onClose();
    requestAnimationFrame(() => scrollTo(id));
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 [--nav-curve-width:20vw] md:[--nav-curve-width:6vw]"
        >
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 cursor-default bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_20%,rgba(0,0,0,0.78)_100%)]"
            onPointerDown={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              ease: DRAWER_EASE,
            }}
          />

          <motion.aside
            id="site-navigation"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-nav-title"
            tabIndex={-1}
            data-nav-drawer
            className="fixed right-0 top-0 z-[51] h-[100svh] w-full bg-[#181715] text-[#f3ede3] md:w-[min(42rem,44vw)]"
            initial={{ x: "122%" }}
            animate={{ x: 0 }}
            exit={{ x: "122%" }}
            transition={{ duration: drawerDuration, ease: DRAWER_EASE }}
          >
            <motion.div
              aria-hidden="true"
              data-nav-curve
              className="absolute left-px top-0 h-full -translate-x-full overflow-hidden"
              initial={{ width: "var(--nav-curve-width)" }}
              animate={{ width: 0 }}
              exit={{ width: "var(--nav-curve-width)" }}
              transition={{ duration: curveDuration, ease: DRAWER_EASE }}
            >
              <span className="absolute left-0 top-1/2 block h-[150%] w-[775%] -translate-x-[6.5%] -translate-y-1/2 rounded-[50%] bg-[#181715]" />
            </motion.div>

            <div className="flex h-full flex-col px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 md:px-[clamp(3rem,6vw,6.5rem)] md:pb-[8vh] md:pt-[7vh]">
              <div className="flex items-center justify-between border-b border-white/15 pb-7 sm:pb-9">
                <p
                  id="site-nav-title"
                  className="text-[0.68rem] uppercase tracking-[0.34em] text-white/45"
                >
                  Navigation
                </p>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-500 text-neutral-950 transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 sm:size-16"
                  onClick={onClose}
                  aria-label="Close navigation"
                >
                  <span
                    aria-hidden="true"
                    className="relative block size-5 transition-transform duration-300 group-hover:rotate-90"
                  >
                    <span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <nav
                aria-label="Primary navigation"
                className="flex min-h-0 flex-1 items-center py-8 sm:py-10"
              >
                <ul className="w-full">
                  {navItems.map((item, index) => (
                    <motion.li
                      key={item.id}
                      initial={{
                        opacity: prefersReducedMotion ? 1 : 0,
                        x: prefersReducedMotion ? 0 : "15vw",
                      }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{
                        opacity: prefersReducedMotion ? 1 : 0,
                        x: prefersReducedMotion ? 0 : "15vw",
                      }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : index * 0.03,
                        duration: itemDuration,
                        ease: DRAWER_EASE,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleClick(item.id)}
                        className="group flex w-full items-center justify-between py-1 text-left text-[clamp(2.6rem,10vw,4.4rem)] font-medium leading-[1.17] tracking-[-0.045em] text-[#f3ede3] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 md:text-[clamp(3.4rem,5vw,5.2rem)]"
                      >
                        <span>{item.label}</span>
                        <span
                          aria-hidden="true"
                          className="size-2.5 scale-0 rounded-full bg-amber-500 opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                        />
                      </button>
                    </motion.li>
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
                              isExternalLink
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
                          >
                            {social.label}
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
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
