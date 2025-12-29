import type { PortfolioData } from "./types";

export const portfolio: PortfolioData = {
  name: "Hyeokjin",
  title: "Frontend Engineer",
  introEyebrow: "2026-ready frontend systems",
  introHeadline: "I design fast, cinematic product narratives without sacrificing accessibility.",
  introSubhead:
    "I build scroll-first experiences that make hiring teams understand scope, decision-making, and outcomes in under two minutes.",
  introHighlights: [
    "App Router + TypeScript systems",
    "Motion that respects performance budgets",
    "Collaborative, product-minded execution",
  ],
  nav: [
    { id: "intro", label: "Intro" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ],
  projects: [
    {
      slug: "aurora-commerce",
      title: "Aurora Commerce",
      summary:
        "Scaled a multi-region storefront by rebuilding the client shell and unlocking edge-cached merchandising.",
      role: "Lead Frontend Engineer",
      impact: "+31% conversion, -42% route transition time",
      stack: ["Next.js", "TypeScript", "Edge", "GSAP"],
      thumbnail: "/example.svg",
      links: [
        { label: "Case study", href: "https://example.com" },
        { label: "Live build", href: "https://example.com" },
      ],
    },
    {
      slug: "signal-ops",
      title: "Signal Ops",
      summary:
        "Designed a real-time operations console with resilient realtime sync and offline-ready flows.",
      role: "Senior Frontend Engineer",
      impact: "-58% incident triage time",
      stack: ["React", "WebSockets", "Design Systems"],
      thumbnail: "/example.svg",
      links: [
        { label: "Case study", href: "https://example.com" },
        { label: "Prototype", href: "https://example.com" },
      ],
    },
    {
      slug: "pulse-labs",
      title: "Pulse Labs",
      summary:
        "Crafted a research platform that translates complex ML outputs into clear human narratives.",
      role: "Frontend Tech Lead",
      impact: "-37% onboarding time for new researchers",
      stack: ["Next.js", "Data Viz", "A11y"],
      thumbnail: "/example.svg",
      links: [
        { label: "Case study", href: "https://example.com" },
        { label: "Demo", href: "https://example.com" },
      ],
    },
  ],
  skills: [
    {
      title: "Scroll choreography",
      problem: "Heavy scroll effects can tank frame rates and overwhelm users.",
      approach:
        "I cap pin count, keep transforms on a single track, and scrub with controlled timing.",
      result: "Cinematic storytelling with consistent 60fps performance.",
    },
    {
      title: "Design-to-code translation",
      problem: "Figma prototypes often miss runtime constraints and edge cases.",
      approach:
        "I formalize DOM contracts, document motion rules, and align with design early.",
      result: "Fewer iterations and predictable delivery.",
    },
    {
      title: "Performance budgeting",
      problem: "Launches regress when performance is treated as a late-stage QA task.",
      approach:
        "I set guardrails for pin sections, texture budgets, and bundle thresholds.",
      result: "Stable Lighthouse scores and durable UX.",
    },
    {
      title: "Accessibility by default",
      problem: "Motion-heavy pages often forget keyboard and reduced-motion needs.",
      approach:
        "I bake in skip links, focus management, and alternate motion profiles.",
      result: "Inclusive interactions without sacrificing impact.",
    },
    {
      title: "Systemic UI architecture",
      problem: "Animations scattered in components are brittle and hard to debug.",
      approach:
        "I centralize animation setup and keep components purely declarative.",
      result: "Maintainable motion systems that scale with the product.",
    },
    {
      title: "Cross-team collaboration",
      problem: "Product, design, and engineering priorities rarely align on timelines.",
      approach:
        "I lead with clear milestones, demos, and lightweight RFCs.",
      result: "Shared momentum and fast, confident releases.",
    },
  ],
  skillsSummary:
    "Design for clarity first, then elevate with motion that respects user intent and performance budgets.",
  contactEmail: "hello@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Email", href: "mailto:hello@example.com" },
  ],
};
