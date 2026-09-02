import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/projects/[slug]/page";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";

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

const nextMocks = vi.hoisted(() => ({
  initFooterCurve: vi.fn(),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/lib/animation/footerCurve", () => ({
  initFooterCurve: nextMocks.initFooterCurve,
}));

let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  nextMocks.initFooterCurve.mockResolvedValue(vi.fn());
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

describe("project route", () => {
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
        title: metadataProject.seoTitle,
        description: metadataProject.seoDescription,
        alternates: {
          canonical: `/projects/${metadataProject.slug}`,
        },
        openGraph: {
          title: metadataProject.seoTitle,
          description: metadataProject.seoDescription,
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

  it("프로젝트 링크의 표시 문구가 바뀌어도 kind로 주소를 선택한다", async () => {
    const project = portfolio.projects[0]!;
    const originalLinks = project.links;
    project.links = originalLinks.map((link) =>
      link.kind === "live"
        ? { ...link, label: "서비스 열기" }
        : { ...link, label: "Source Code" },
    );

    try {
      const page = await ProjectPage({
        params: Promise.resolve({ slug: project.slug }),
      });
      const container = await mountProject(page);
      const links = Array.from(
        container.querySelectorAll<HTMLAnchorElement>(".project-detail-links a"),
      );

      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        originalLinks.map(({ href }) => href),
      );
      expect(links.map((link) => link.textContent)).toEqual([
        "서비스 열기 ↗",
        "Source Code ↗",
      ]);
    } finally {
      project.links = originalLinks;
    }
  });

  it("소셜 링크의 표시 문구가 바뀌어도 github kind로 주소와 문구를 선택한다", async () => {
    const project = portfolio.projects[0]!;
    const originalSocials = portfolio.socials;
    portfolio.socials = originalSocials.map((social) =>
      social.kind === "github" ? { ...social, label: "Source Code" } : social,
    );

    try {
      const page = await ProjectPage({
        params: Promise.resolve({ slug: project.slug }),
      });
      const container = await mountProject(page);
      const githubLink = container.querySelector<HTMLAnchorElement>(
        'nav[aria-label="프로젝트 상세 외부 링크"] a[href^="https://github.com/"]',
      );

      expect(githubLink?.getAttribute("href")).toBe(
        "https://github.com/blueiz920",
      );
      expect(githubLink?.textContent).toContain("Source Code");
    } finally {
      portfolio.socials = originalSocials;
    }
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

      expect(container.querySelectorAll(".project-detail-chapter")).toHaveLength(
        chapters,
      );
      evidence.forEach((item) => expect(container.textContent).toContain(item));
    },
  );

  it.each(portfolio.projects)(
    "각 프로젝트의 상세 renderer와 chapter anchor를 연결한다",
    async ({ slug }) => {
      const page = await ProjectPage({ params: Promise.resolve({ slug }) });
      const container = await mountProject(page);

      expect(
        container.querySelector(`[data-project-detail="${slug}"]`),
      ).not.toBeNull();

      const tocHrefs = Array.from(
        container.querySelectorAll<HTMLAnchorElement>(
          'nav[aria-label="프로젝트 상세 목차"] a',
        ),
      ).map((link) => link.getAttribute("href"));
      const chapterIds = Array.from(
        container.querySelectorAll<HTMLElement>(".project-detail-chapter"),
      ).map((chapter) => chapter.id);

      expect(tocHrefs).toEqual(chapterIds.map((id) => `#${id}`));
    },
  );

  it.each(portfolio.projects)(
    "각 프로젝트의 구조화 데이터가 상세 페이지 정보와 일치한다",
    async (schemaProject) => {
      const page = await ProjectPage({
        params: Promise.resolve({ slug: schemaProject.slug }),
      });
      const container = await mountProject(page);
      const schemaScripts = container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      );
      const schema = JSON.parse(schemaScripts[0]?.textContent ?? "{}");
      const liveLink = schemaProject.links.find(({ kind }) => kind === "live");
      const githubLink = schemaProject.links.find(
        ({ kind }) => kind === "github",
      );

      expect(schemaScripts).toHaveLength(1);
      expect(schemaScripts[0]?.id).toBe(`project-schema-${schemaProject.slug}`);
      expect(schema).toMatchObject({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: schemaProject.title,
        description: schemaProject.seoDescription,
        url: `${siteConfig.url}/projects/${schemaProject.slug}`,
        image: `${siteConfig.url}${schemaProject.ogImage}`,
        inLanguage: "ko-KR",
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
          alternateName: siteConfig.author.alternateName,
          url: siteConfig.url,
        },
        keywords: schemaProject.stack,
        about: {
          "@type": "SoftwareApplication",
          name: schemaProject.title,
          description: schemaProject.summary,
          applicationCategory: "WebApplication",
          operatingSystem: "Web",
          url: liveLink?.href,
          sameAs: githubLink?.href,
        },
      });
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

  it("등록되지 않은 slug는 404를 반환한다", async () => {
    await expect(
      ProjectPage({
        params: Promise.resolve({ slug: "unmapped-project" }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
