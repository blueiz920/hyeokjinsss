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
import { markIntroReady } from "@/lib/animation/introLoader";
import { Intro } from "./Intro";

const introMocks = vi.hoisted(() => ({
  initIntroAnimation: vi.fn(),
  initIntroScroll: vi.fn(),
  register: vi.fn(),
  scrollTo: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/sections/IntroTextureOverlay", () => ({
  IntroTextureOverlay: () => null,
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({
    register: introMocks.register,
    scrollTo: introMocks.scrollTo,
    unregister: introMocks.unregister,
  }),
}));

vi.mock("@/lib/animation/intro", () => ({
  initIntroAnimation: introMocks.initIntroAnimation,
  initIntroScroll: introMocks.initIntroScroll,
}));

let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

const mountIntro = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(<Intro />);
    await Promise.resolve();
  });

  return container.querySelector<HTMLElement>("#intro")!;
};

beforeEach(() => {
  delete document.documentElement.dataset.introReady;
  Object.values(introMocks).forEach((mock) => mock.mockReset());
  introMocks.initIntroAnimation.mockResolvedValue(vi.fn());
  introMocks.initIntroScroll.mockResolvedValue(vi.fn());
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.introReady;
});

describe("Intro readiness", () => {
  it("로더 완료 전에는 진입 애니메이션을 시작하지 않고 완료 신호 뒤 시작한다", async () => {
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).not.toHaveBeenCalled();

    await act(async () => {
      markIntroReady();
      await Promise.resolve();
    });

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(section, false);
  });

  it("로더가 먼저 완료된 경우에는 마운트 직후 진입 애니메이션을 시작한다", async () => {
    markIntroReady();
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(section, false);
  });
});
