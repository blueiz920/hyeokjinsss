import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
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

const nextMocks = vi.hoisted(() => ({
  initFooterCurve: vi.fn(),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/lib/animation/footerCurve", () => ({
  initFooterCurve: nextMocks.initFooterCurve,
}));

const project: Project = portfolio.projects[0];
let mountedRoots: Root[] = [];

const createPointerMedia = (matches: boolean) => ({
  matches,
  media: "(hover: hover) and (pointer: fine)",
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  nextMocks.initFooterCurve.mockResolvedValue(vi.fn());
  vi.stubGlobal("matchMedia", vi.fn(() => createPointerMedia(false)));
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
  vi.clearAllMocks();
});

describe("project route links", () => {
  it("각 데스크톱 행을 행 참조를 유지한 내부 전환 링크로 만든다", async () => {
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

  it("fine pointer가 행에 들어오면 미리보기 RAF를 시작하고 나가면 취소한다", async () => {
    const requestFrame = vi.fn(() => 17);
    const cancelFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => createPointerMedia(true)),
    );

    const container = await mountProject(
      <ProjectDesktopList
        projects={[project]}
        prefersReducedMotion={false}
        setRowRef={vi.fn()}
      />,
    );
    const item = container.querySelector<HTMLElement>(".project-desktop-item")!;

    const enter = new Event("pointerover", { bubbles: true });
    Object.defineProperties(enter, {
      clientX: { value: 120 },
      clientY: { value: 80 },
      pointerType: { value: "mouse" },
    });
    item.dispatchEvent(enter);

    expect(requestFrame).toHaveBeenCalledOnce();

    item.dispatchEvent(new Event("pointerout", { bubbles: true }));
    expect(cancelFrame).toHaveBeenCalledWith(17);
  });

  it("미리보기 RAF가 남아 있으면 언마운트 시 취소한다", async () => {
    const requestFrame = vi.fn(() => 23);
    const cancelFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => createPointerMedia(true)),
    );

    const { root, container } = await mountProject(
      <ProjectDesktopList
        projects={[project]}
        prefersReducedMotion={false}
        setRowRef={vi.fn()}
      />,
    ).then((mountedContainer) => ({
      container: mountedContainer,
      root: mountedRoots[mountedRoots.length - 1]!,
    }));
    const item = container.querySelector<HTMLElement>(".project-desktop-item")!;
    const enter = new Event("pointerover", { bubbles: true });
    Object.defineProperties(enter, {
      clientX: { value: 120 },
      clientY: { value: 80 },
      pointerType: { value: "mouse" },
    });
    item.dispatchEvent(enter);

    await act(async () => root.unmount());
    mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);

    expect(cancelFrame).toHaveBeenCalledWith(23);
  });

  it.each([
    { label: "reduced motion", prefersReducedMotion: true, pointerType: "mouse", fine: true },
    { label: "coarse pointer", prefersReducedMotion: false, pointerType: "mouse", fine: false },
    { label: "touch pointer", prefersReducedMotion: false, pointerType: "touch", fine: true },
  ])(
    "$label에서는 미리보기 RAF를 시작하지 않는다",
    async ({ prefersReducedMotion, pointerType, fine }) => {
      const requestFrame = vi.fn(() => 29);
      vi.stubGlobal("requestAnimationFrame", requestFrame);
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => createPointerMedia(fine)),
      );

      const container = await mountProject(
        <ProjectDesktopList
          projects={[project]}
          prefersReducedMotion={prefersReducedMotion}
          setRowRef={vi.fn()}
        />,
      );
      const item = container.querySelector<HTMLElement>(".project-desktop-item")!;
      const enter = new Event("pointerover", { bubbles: true });
      Object.defineProperties(enter, {
        clientX: { value: 120 },
        clientY: { value: 80 },
        pointerType: { value: pointerType },
      });
      item.dispatchEvent(enter);

      expect(requestFrame).not.toHaveBeenCalled();
    },
  );

  it("모바일 외부 링크를 내부 프로젝트 경로 링크 밖에 둔다", async () => {
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

  it("포트폴리오 데이터에서 정적 상세 경로 매개변수를 만든다", () => {
    expect(generateStaticParams()).toEqual(
      portfolio.projects.map(({ slug }) => ({ slug })),
    );
  });

  it.each(portfolio.projects)(
    "각 프로젝트의 대표 주소와 공유 메타데이터를 만든다",
    async (metadataProject) => {
      await expect(
        generateMetadata({
          params: Promise.resolve({ slug: metadataProject.slug }),
        }),
      ).resolves.toMatchObject({
        title: metadataProject.title,
        description: metadataProject.summary,
        alternates: {
          canonical: `/projects/${metadataProject.slug}`,
        },
        openGraph: {
          title: metadataProject.title,
          description: metadataProject.summary,
          url: `/projects/${metadataProject.slug}`,
          images: [
            {
              url: metadataProject.ogImage,
              width: 1200,
              height: 630,
            },
          ],
        },
      });
    },
  );

  it("모음.zip 사례에 근거가 담긴 네 개 장을 렌더링한다", async () => {
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
    expect(container.querySelector(".project-detail-next")?.tagName).toBe(
      "FOOTER",
    );
    await vi.waitFor(() => expect(nextMocks.initFooterCurve).toHaveBeenCalledOnce());
  });

  it("프로젝트 상세 종료 동선에 탐색·연락·GitHub 링크를 담는다", async () => {
    const page = await ProjectPage({
      params: Promise.resolve({ slug: "moum-zip" }),
    });
    const container = await mountProject(page);
    const footer = container.querySelector<HTMLElement>(
      ".project-detail-next",
    )!;
    const navigateNav = footer.querySelector<HTMLElement>(
      'nav[aria-label="사이트 섹션 바로가기"]',
    )!;
    const elsewhereNav = footer.querySelector<HTMLElement>(
      'nav[aria-label="프로젝트 상세 외부 링크"]',
    )!;
    const allProjectsCta = footer.querySelectorAll(
      ".project-detail-next-all",
    );
    const contactLink = elsewhereNav.querySelector<HTMLAnchorElement>(
      'a[href^="mailto:"]',
    );
    const githubLink = elsewhereNav.querySelector<HTMLAnchorElement>(
      'a[href^="https://github.com/"]',
    );

    expect(allProjectsCta).toHaveLength(1);
    expect(
      footer.querySelector<HTMLAnchorElement>(
        ".project-detail-next-all",
      )?.dataset.transitionLabel,
    ).toBe("project");
    expect(footer.querySelector(".project-detail-section-nav")).toBeNull();
    expect(elsewhereNav.querySelector(".project-detail-next-all")).toBeNull();
    expect(navigateNav.querySelector(".project-detail-close-eyebrow")?.textContent).toBe(
      "Navigate",
    );
    expect(elsewhereNav.querySelector(".project-detail-close-eyebrow")?.textContent).toBe(
      "Elsewhere",
    );
    expect(
      Array.from(navigateNav.querySelectorAll<HTMLAnchorElement>("a")).map(
        (link) => link.getAttribute("href"),
      ),
    ).toEqual(["/#projects", "/#skills", "/#contact"]);
    expect(
      Array.from(navigateNav.querySelectorAll<HTMLAnchorElement>("a")).map(
        (link) => link.dataset.transitionLabel,
      ),
    ).toEqual(["Projects", "Skills", "Contact"]);
    expect(contactLink?.getAttribute("href")).toBe(
      `mailto:${portfolio.contactEmail}`,
    );
    expect(githubLink?.getAttribute("target")).toBe("_blank");
    expect(githubLink?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it.each([
    {
      slug: "k-festival",
      chapters: 4,
      evidence: ["8 → 0", 'duplex: "half"', "Zustand language"],
    },
    {
      slug: "yajoba",
      chapters: 3,
      evidence: ["2 → 1", "productId", "html2canvas"],
    },
  ])(
    "각 프로젝트의 근거를 렌더링한다",
    async ({ slug, chapters, evidence }) => {
      const page = await ProjectPage({ params: Promise.resolve({ slug }) });
      const container = await mountProject(page);

      expect(
        container.querySelector(`[data-project-detail="${slug}"]`),
      ).not.toBeNull();
      expect(container.querySelectorAll(".project-detail-chapter")).toHaveLength(
        chapters,
      );
      evidence.forEach((item) => expect(container.textContent).toContain(item));
    },
  );

  it.each(
    portfolio.projects.map((orderedProject, index) => ({
      orderedProject,
      index,
    })),
  )(
    "각 프로젝트의 사례 순서와 다음 링크를 계산한다",
    async ({ orderedProject, index }) => {
      const page = await ProjectPage({
        params: Promise.resolve({ slug: orderedProject.slug }),
      });
      const container = await mountProject(page);
      const nextProject =
        portfolio.projects[(index + 1) % portfolio.projects.length];

      expect(
        container.querySelector(".project-detail-topline > p")?.textContent,
      ).toBe(
        `Case ${String(index + 1).padStart(2, "0")} / ${String(portfolio.projects.length).padStart(2, "0")}`,
      );
      expect(
        container
          .querySelector<HTMLAnchorElement>(".project-detail-next-link")
          ?.getAttribute("href"),
      ).toBe(`/projects/${nextProject.slug}`);
      expect(
        container.querySelector("#next-project-title")?.textContent,
      ).toBe(nextProject.title);
    },
  );

  it("매핑되지 않은 프로젝트를 Yajoba로 대체하지 않고 404를 반환한다", async () => {
    const unmappedProject: Project = {
      ...project,
      slug: "unmapped-project",
      title: "Unmapped project",
    };
    portfolio.projects.push(unmappedProject);

    try {
      await expect(
        ProjectPage({
          params: Promise.resolve({ slug: unmappedProject.slug }),
        }),
      ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    } finally {
      portfolio.projects.pop();
    }
  });
});
