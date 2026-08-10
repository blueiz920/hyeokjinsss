type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  impact: string;
  stack: string[];
  thumbnail: string;
  links: ProjectLink[];
};

export type SkillCapability = {
  title: string;
  tools: string[];
  summary: string;
  project: string;
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
  introSubhead: string;
  introHighlights: string[];
  projects: Project[];
  skills: SkillCapability[];
  contactEmail: string;
  socials: ProjectLink[];
  nav: NavItem[];
};
