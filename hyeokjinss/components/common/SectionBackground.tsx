"use client";

import { forwardRef } from "react";

type Variant = "intro" | "projects" | "skills";

type Props = {
  variant: Variant;
  density?: number;
  className?: string;
};

/** 문자열 -> 32bit 해시 */
const hash32 = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** 결정적 PRNG: mulberry32 */
const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** (variant, index, key) 조합으로 0~1 난수 생성 */
const rand01 = (variant: string, index: number, key: string) => {
  const seed = hash32(`${variant}:${index}:${key}`);
  const r = mulberry32(seed);
  return r();
};

const ICONS = [
  ({ className }: { className: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  ({ className }: { className: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  ({ className }: { className: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M6 16l6-8 6 8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16h12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
];

export const SectionBackground = forwardRef<HTMLDivElement, Props>(
  ({ variant, density = 12, className }, ref) => {
    const base =
      variant === "projects"
        ? { blur: 1, opacity: 0.10 }
        : variant === "skills"
          ? { blur: 2, opacity: 0.12 }
          : { blur: 2, opacity: 0.14 };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 overflow-hidden",
          className ?? "",
        ].join(" ")}
      >
        {/* 아이콘 레이어 */}
        <div className="absolute inset-0">
          {Array.from({ length: density }).map((_, i) => {
            const Icon = ICONS[i % ICONS.length];

            const top = rand01(variant, i, "top") * 100;
            const left = rand01(variant, i, "left") * 100;
            const size = 18 + rand01(variant, i, "size") * 26; // 18~44

            return (
              <div
                key={`${variant}-bg-${i}`}
                className="absolute text-white/70"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: base.opacity,
                  filter: base.blur ? `blur(${base.blur}px)` : "none",
                  transform: "translate(-50%, -50%)",
                  willChange: "transform, opacity, filter",
                }}
              >
                <Icon className="h-full w-full" />
              </div>
            );
          })}
        </div>

        {/* 아주 약한 질감 */}
        <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>
    );
  },
);

SectionBackground.displayName = "SectionBackground";
