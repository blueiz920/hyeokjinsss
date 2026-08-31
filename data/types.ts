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

export type Project = {
  slug: ProjectSlug;
  title: string;
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
  tools: string[];
  summary: string;
  projects: SkillProjectReference[];
  evidence: string;
};

export type NavItem = {
  id: string;
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
