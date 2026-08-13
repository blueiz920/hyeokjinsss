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
import { ProjectReveal } from "./ProjectReveal";

const projectMocks = vi.hoisted(() => ({
  cleanupCurve: vi.fn(),
  getProjectCardIndex: vi.fn((cards: HTMLElement[]) =>
    cards[0]?.dataset.projectSource === "desktop" ? 2 : 1,
  ),
  initProjectCurve: vi.fn(),
  register: vi.fn(),
  removeMediaListener: vi.fn(),
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

vi.mock("@/components/common/ProjectRevealCard", async () => {
  const { forwardRef } = await import("react");

  return {
    ProjectRevealCard: forwardRef<HTMLElement, { index: number }>(
      ({ index }, ref) => (
        <article ref={ref} data-project-source="mobile" data-index={index} />
      ),
    ),
  };
});

vi.mock("@/components/common/ProjectDesktopList", () => ({
  ProjectDesktopList: ({
    projects,
    setRowRef,
  }: {
    projects: Array<{ slug: string }>;
    setRowRef: (index: number, node: HTMLElement | null) => void;
  }) => (
    <div>
      {projects.map((project, index) => (
        <article
          key={project.slug}
          ref={(node) => setRowRef(index, node)}
          data-project-source="desktop"
          data-index={index}
        />
      ))}
    </div>
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
let mediaMatches = false;
let mediaListener: (() => void) | null = null;

class IntersectionObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "0px";
  thresholds = [0];
}

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
  mediaMatches = false;
  mediaListener = null;
  Object.values(projectMocks).forEach((mock) => mock.mockClear());
  projectMocks.initProjectCurve.mockResolvedValue(projectMocks.cleanupCurve);

  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return mediaMatches;
      },
      media: "(min-width: 1024px)",
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        mediaListener = listener;
      }),
      removeEventListener: projectMocks.removeMediaListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
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
  it("중단점이 바뀌면 현재 레이아웃의 프로젝트 목록으로 단계를 다시 계산한다", async () => {
    const { container, root } = await mountProjects();
    const section = container.querySelector<HTMLElement>("#projects");
    const curve = container.querySelector<HTMLElement>(".project-entry-curve");

    expect(projectMocks.setProjectsTotal).toHaveBeenCalledWith(3);
    expect(projectMocks.initProjectCurve).toHaveBeenCalledWith({
      section,
      curve,
    });
    expect(projectMocks.setProjectsActive).toHaveBeenCalledWith(true);
    expect(projectMocks.getProjectCardIndex.mock.calls.at(-1)?.[0]).toSatisfy(
      (cards: HTMLElement[]) =>
        cards.every((card) => card.dataset.projectSource === "mobile"),
    );
    expect(projectMocks.setProjectsStep).toHaveBeenLastCalledWith(1);

    mediaMatches = true;
    await act(async () => mediaListener?.());

    expect(projectMocks.getProjectCardIndex.mock.calls.at(-1)?.[0]).toSatisfy(
      (cards: HTMLElement[]) =>
        cards.every((card) => card.dataset.projectSource === "desktop"),
    );
    expect(projectMocks.setProjectsStep).toHaveBeenLastCalledWith(2);

    await act(async () => root.unmount());
    mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);

    expect(projectMocks.removeMediaListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(projectMocks.setProjectsActive).toHaveBeenLastCalledWith(false);
    expect(projectMocks.cleanupCurve).toHaveBeenCalledOnce();
  });
});
