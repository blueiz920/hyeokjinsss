import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "@/data/portfolio";
import type { Project } from "@/data/types";
import { ProjectList } from "./ProjectList";
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

describe("project list", () => {
  it("각 프로젝트 항목을 항목 참조를 유지한 내부 전환 링크로 만든다", async () => {
    const setItemRef = vi.fn();
    const container = await mountProject(
      <ProjectList
        projects={[project]}
        prefersReducedMotion={false}
        setItemRef={setItemRef}
      />,
    );

    const link = container.querySelector<HTMLAnchorElement>(
      ".project-list-row",
    )!;

    expect(link).toHaveProperty("tagName", "A");
    expect(link.getAttribute("href")).toBe(`/projects/${project.slug}`);
    expect(link.dataset.transitionLabel).toBe(project.title);
    expect(setItemRef).toHaveBeenCalledWith(0, link.closest("li"));
  });

  it("SSR에서 프로젝트별 상세 링크 하나와 표현 전용 미리보기만 렌더링한다", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <ProjectList
        projects={portfolio.projects}
        prefersReducedMotion={false}
        setItemRef={vi.fn()}
      />,
    );

    const items = container.querySelectorAll(".project-list-item");
    const preview = container.querySelector<HTMLElement>(
      ".project-desktop-preview",
    );

    expect(items).toHaveLength(portfolio.projects.length);
    items.forEach((item, index) => {
      const detailLinks = item.querySelectorAll(
        `a[href="/projects/${portfolio.projects[index]?.slug}"]`,
      );

      expect(detailLinks).toHaveLength(1);
    });
    expect(preview?.getAttribute("aria-hidden")).toBe("true");
    expect(preview?.querySelector("a")).toBeNull();
    expect(preview?.querySelector("h1, h2, h3")).toBeNull();
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
      <ProjectList
        projects={[project]}
        prefersReducedMotion={false}
        setItemRef={vi.fn()}
      />,
    );
    const item = container.querySelector<HTMLElement>(".project-list-item")!;

    const enter = new Event("pointerover", { bubbles: true });
    Object.defineProperties(enter, {
      clientX: { value: 120 },
      clientY: { value: 80 },
      pointerType: { value: "mouse" },
    });
    await act(async () => {
      item.dispatchEvent(enter);
    });

    expect(requestFrame).toHaveBeenCalledOnce();

    await act(async () => {
      item.dispatchEvent(new Event("pointerout", { bubbles: true }));
    });
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
      <ProjectList
        projects={[project]}
        prefersReducedMotion={false}
        setItemRef={vi.fn()}
      />,
    ).then((mountedContainer) => ({
      container: mountedContainer,
      root: mountedRoots[mountedRoots.length - 1]!,
    }));
    const item = container.querySelector<HTMLElement>(".project-list-item")!;
    const enter = new Event("pointerover", { bubbles: true });
    Object.defineProperties(enter, {
      clientX: { value: 120 },
      clientY: { value: 80 },
      pointerType: { value: "mouse" },
    });
    await act(async () => {
      item.dispatchEvent(enter);
    });

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
        <ProjectList
          projects={[project]}
          prefersReducedMotion={prefersReducedMotion}
          setItemRef={vi.fn()}
        />,
      );
      const item = container.querySelector<HTMLElement>(".project-list-item")!;
      const enter = new Event("pointerover", { bubbles: true });
      Object.defineProperties(enter, {
        clientX: { value: 120 },
        clientY: { value: 80 },
        pointerType: { value: pointerType },
      });
      await act(async () => {
        item.dispatchEvent(enter);
      });

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
});
