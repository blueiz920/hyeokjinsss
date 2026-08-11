import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ProjectPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/projects/[slug]/page";
import { portfolio } from "@/data/portfolio";
import type { Project } from "@/data/types";
import { ProjectDesktopList } from "./ProjectDesktopList";
import { ProjectRevealCard } from "./ProjectRevealCard";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));

vi.mock("@/components/common/TransitionLink", () => ({
  TransitionLink: ({
    children,
    label,
    ...props
  }: React.ComponentProps<"a"> & { label: string }) => (
    <a {...props} data-transition-label={label}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/animation/projectReveal", () => ({
  useProjectCardMotion: () => ({ cardStyle: {}, imageStyle: {} }),
}));

const project: Project = portfolio.projects[0];
let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

async function mountProject(node: React.ReactNode) {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => root.render(node));

  return container;
}

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }

  mountedRoots = [];
  document.body.replaceChildren();
});

describe("project route links", () => {
  it("makes each desktop row an internal transition link without losing its row ref", async () => {
    const setRowRef = vi.fn();
    const container = await mountProject(
      <ProjectDesktopList
        projects={[project]}
        prefersReducedMotion={false}
        setRowRef={setRowRef}
      />,
    );

    const link = container.querySelector<HTMLAnchorElement>(
      ".project-desktop-row",
    )!;

    expect(link).toHaveProperty("tagName", "A");
    expect(link.getAttribute("href")).toBe(`/projects/${project.slug}`);
    expect(link.dataset.transitionLabel).toBe(project.title);
    expect(setRowRef).toHaveBeenCalledWith(0, link.closest("li"));
  });

  it("keeps mobile external links outside the internal project route link", async () => {
    const container = await mountProject(
      <ProjectRevealCard
        project={project}
        index={0}
        total={portfolio.projects.length}
        prefersReducedMotion={false}
      />,
    );

    const routeLink = container.querySelector<HTMLAnchorElement>(
      ".project-mobile-route",
    )!;
    const externalLinks = container.querySelectorAll<HTMLAnchorElement>(
      ".project-mobile-link",
    );

    expect(routeLink.getAttribute("href")).toBe(`/projects/${project.slug}`);
    expect(routeLink.dataset.transitionLabel).toBe(project.title);
    expect(routeLink.querySelector(".project-mobile-links")).toBeNull();
    expect(routeLink.querySelector("a")).toBeNull();
    expect(externalLinks).toHaveLength(project.links.length);
    expect(externalLinks[0].getAttribute("target")).toBe("_blank");
  });

  it("generates static detail params and project metadata from portfolio data", async () => {
    expect(generateStaticParams()).toEqual(
      portfolio.projects.map(({ slug }) => ({ slug })),
    );

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: project.slug }) }),
    ).resolves.toMatchObject({
      title: project.title,
      description: project.summary,
    });
  });

  it("renders the Moum case study with its four evidence-backed chapters", async () => {
    const page = await ProjectPage({
      params: Promise.resolve({ slug: "moum-zip" }),
    });
    const container = await mountProject(page);

    expect(
      container.querySelector('[data-project-detail="moum-zip"]'),
    ).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("모음.zip");
    expect(container.querySelectorAll(".project-detail-chapter")).toHaveLength(
      4,
    );
    expect(container.querySelectorAll(".project-evidence")).toHaveLength(4);
    expect(
      container.querySelector('nav[aria-label="프로젝트 상세 목차"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("1.5s → 0.8s");
    expect(container.textContent).toContain("Vitest 43개 케이스");
  });
});
