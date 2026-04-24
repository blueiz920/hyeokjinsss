"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import type { NavItem } from "@/data/types";

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
  restoreFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { scrollTo } = useSectionRegistry();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-nav-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-full flex-col justify-between px-6 py-10">
            <div className="flex items-center justify-between">
              <p
                id="mobile-nav-title"
                className="text-xs uppercase tracking-[0.4em] text-white/60"
              >
                Navigation
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                className="text-xs uppercase tracking-[0.3em] text-white"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            <nav className="space-y-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item.id)}
                  className="block text-3xl font-semibold text-white"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <p className="text-sm text-white/60">
              Scroll-first narrative built for recruiters who move fast.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
