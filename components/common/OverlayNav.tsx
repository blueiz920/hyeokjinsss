"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSectionRegistry } from "@/hooks/useSectionRegistry";
import type { NavItem } from "@/data/types";

export const OverlayNav = ({
  open,
  onClose,
  navItems,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
}) => {
  const { scrollTo } = useSectionRegistry();

  const handleClick = (id: string) => {
    scrollTo(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-full flex-col justify-between px-6 py-10">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Navigation
              </p>
              <button
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
