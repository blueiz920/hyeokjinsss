import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
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
import { ProjectReveal } from "./ProjectReveal";

const projectMocks = vi.hoisted(() => ({
  cleanupCurve: vi.fn(),
  getProjectCardIndex: vi.fn(() => 1),
  initProjectCurve: vi.fn(),
  register: vi.fn(),
  setProjectsActive: vi.fn(),
  setProjectsStep: vi.fn(),
  setProjectsTotal: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock("@/data/portfolio", () => ({
  portfolio: {
    projects: [
      { slug: "first" },
      { slug: "second" },
      { slug: "third" },
    ],
  },
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/common/ProjectList", () => ({
  ProjectList: ({
    projects,
    setItemRef,
  }: {
    projects: Array<{ slug: string }>;
    setItemRef: (index: number, node: HTMLElement | null) => void;
  }) => (
    <ul data-project-list>
      {projects.map((project, index) => (
        <li
          key={project.slug}
          ref={(node) => setItemRef(index, node)}
          data-project-source="project"
          data-index={index}
        >
          <a href={`/projects/${project.slug}`}>{project.slug}</a>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({
    register: projectMocks.register,
    unregister: projectMocks.unregister,
  }),
}));

vi.mock("@/hooks/useScrollIndicators", () => ({
  useScrollIndicators: () => ({
    setProjectsActive: projectMocks.setProjectsActive,
    setProjectsStep: projectMocks.setProjectsStep,
    setProjectsTotal: projectMocks.setProjectsTotal,
  }),
}));

vi.mock("@/lib/animation/projectReveal", () => ({
  getProjectCardIndex: projectMocks.getProjectCardIndex,
}));

vi.mock("@/lib/animation/projectCurve", () => ({
  initProjectCurve: projectMocks.initProjectCurve,
}));

let mountedRoots: Root[] = [];

class IntersectionObserverMock {
  observed: Element[] = [];
  disconnect = vi.fn();
  observe = vi.fn((target: Element) => {
    this.observed.push(target);
  });
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "0px";
  thresholds = [0];

  constructor() {
    observerInstances.push(this);
  }
}

const observerInstances: IntersectionObserverMock[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

const mountProjects = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => root.render(<ProjectReveal />));

  return { container, root };
};

beforeEach(() => {
  observerInstances.length = 0;
  Object.values(projectMocks).forEach((mock) => mock.mockClear());
  projectMocks.initProjectCurve.mockResolvedValue(projectMocks.cleanupCurve);

  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this.id === "projects") {
        return {
          bottom: 1200,
          height: 1200,
          left: 0,
          right: 1000,
          top: 0,
          width: 1000,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      }

      return {
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    },
  );
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ProjectReveal indicator", () => {
  it("SSR에서 프로젝트마다 의미 항목과 상세 링크를 하나씩 렌더링한다", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ProjectReveal />);

    expect(
      container.querySelectorAll('[data-project-source="project"]'),
    ).toHaveLength(3);
    expect(container.querySelectorAll('a[href^="/projects/"]')).toHaveLength(
      3,
    );
    expect(
      container.querySelectorAll('[data-project-source="mobile"]'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('[data-project-source="desktop"]'),
    ).toHaveLength(0);
  });

  it("hydration과 breakpoint 변경 후에도 같은 의미 프로젝트 목록을 유지한다", async () => {
    const { container } = await mountProjects();

    expect(
      container.querySelectorAll('[data-project-source="project"]'),
    ).toHaveLength(3);
    expect(container.querySelectorAll('a[href^="/projects/"]')).toHaveLength(
      3,
    );

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(
      container.querySelectorAll('[data-project-source="project"]'),
    ).toHaveLength(3);
    expect(container.querySelectorAll('a[href^="/projects/"]')).toHaveLength(
      3,
    );
  });

  it("indicator observer가 같은 프로젝트 항목을 관찰하고 언마운트 시 정리한다", async () => {
    const { container, root } = await mountProjects();
    const section = container.querySelector<HTMLElement>("#projects");
    const projectItems = Array.from(
      container.querySelectorAll<HTMLElement>('[data-project-source="project"]'),
    );
    const projectObserver = observerInstances.find((observer) =>
      observer.observed.includes(section!),
    );

    expect(projectObserver?.observed).toEqual([section, ...projectItems]);
    expect(projectMocks.getProjectCardIndex).toHaveBeenCalledWith(projectItems);
    expect(projectMocks.setProjectsActive).toHaveBeenCalledWith(true);
    expect(projectMocks.setProjectsTotal).toHaveBeenCalledWith(3);
    expect(projectMocks.setProjectsStep).toHaveBeenLastCalledWith(1);

    await act(async () => root.unmount());
    mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);

    expect(projectObserver?.disconnect).toHaveBeenCalledOnce();
    expect(projectMocks.setProjectsActive).toHaveBeenLastCalledWith(false);
    expect(projectMocks.cleanupCurve).toHaveBeenCalledOnce();
  });
});
