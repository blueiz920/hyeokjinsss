type ProjectLink = {
  kind: "live" | "github";
  label: string;
  href: string;
};

type SocialLink = {
  kind: "github" | "email";
  label: string;
  href: string;
};

export type ProjectSlug = "moum-zip" | "k-festival" | "yajoba";

export type SectionId = "intro" | "projects" | "skills" | "contact";

export type SkillTool =
  | "React"
  | "TypeScript"
  | "Tailwind CSS"
  | "TanStack Query"
  | "Zustand"
  | "STOMP WebSocket"
  | "Next.js"
  | "Rendering"
  | "Sitemap"
  | "Framer Motion"
  | "GSAP"
  | "Lenis"
  | "Vitest"
  | "GitHub Actions"
  | "Vercel";

export type Project = {
  slug: ProjectSlug;
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  role: string;
  impact: string;
  stack: string[];
  thumbnail: string;
  ogImage: string;
  links: ProjectLink[];
};

export type SkillProjectReference =
  | {
      slug: ProjectSlug;
    }
  | {
      label: string;
    };

export type SkillCapability = {
  title: string;
  tools: SkillTool[];
  summary: string;
  projects: SkillProjectReference[];
  evidence: string;
};

export type NavItem = {
  id: SectionId;
  label: string;
};

export type IntroHeadline = {
  accent: string;
  rest: string;
};

export type PortfolioData = {
  name: string;
  title: string;
  introEyebrow: string;
  introHeadline: IntroHeadline;
  projects: Project[];
  skills: SkillCapability[];
  contactEmail: string;
  socials: SocialLink[];
  nav: NavItem[];
};
