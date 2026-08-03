import { act, useEffect, useRef } from "react";
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
import {
  SectionRegistryProvider,
  useSectionRegistry,
} from "./useSectionRegistry";

const registryMocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
}));

vi.mock("./useScrollRuntime", () => ({
  useScrollRuntime: () => ({
    prefersReducedMotion: registryMocks.prefersReducedMotion,
  }),
}));

let mountedRoots: Root[] = [];
const scrollIntoView = vi.fn();

const RegistryHarness = ({ registerTarget }: { registerTarget: boolean }) => {
  const targetRef = useRef<HTMLElement | null>(null);
  const { register, unregister, scrollTo } = useSectionRegistry();

  useEffect(() => {
    if (!registerTarget) return;

    register("projects", targetRef);
    return () => unregister("projects");
  }, [register, registerTarget, unregister]);

  return (
    <>
      <button type="button" onClick={() => scrollTo("projects")}>
        프로젝트로 이동
      </button>
      <section
        id={registerTarget ? "registered-projects" : "projects"}
        ref={targetRef}
        tabIndex={-1}
      />
    </>
  );
};

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

const mountRegistry = async (registerTarget: boolean) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(
      <SectionRegistryProvider>
        <RegistryHarness registerTarget={registerTarget} />
      </SectionRegistryProvider>,
    );
  });

  return container;
};

beforeEach(() => {
  registryMocks.prefersReducedMotion = false;
  scrollIntoView.mockReset();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

describe("SectionRegistryProvider", () => {
  it("등록된 section으로 부드럽게 이동한 뒤 포커스를 넘긴다", async () => {
    const container = await mountRegistry(true);
    const button = container.querySelector("button")!;
    const section = container.querySelector("section")!;

    await act(async () => button.click());

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(document.activeElement).toBe(section);
  });

  it("reduced motion에서는 DOM fallback section으로 즉시 이동한다", async () => {
    registryMocks.prefersReducedMotion = true;
    const container = await mountRegistry(false);
    const button = container.querySelector("button")!;
    const section = container.querySelector("section")!;

    await act(async () => button.click());

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(document.activeElement).toBe(section);
  });
});
