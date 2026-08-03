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
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";
import { Intro } from "./Intro";

const introMocks = vi.hoisted(() => ({
  initIntroAnimation: vi.fn(),
  initIntroScroll: vi.fn(),
  lockScroll: vi.fn(),
  register: vi.fn(),
  scrollTo: vi.fn(),
  unlockScroll: vi.fn(),
  unregister: vi.fn(),
}));

const introState = vi.hoisted(() => ({
  prefersReducedMotion: false,
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/sections/IntroTextureOverlay", () => ({
  IntroTextureOverlay: () => null,
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({
    lockScroll: introMocks.lockScroll,
    prefersReducedMotion: introState.prefersReducedMotion,
    unlockScroll: introMocks.unlockScroll,
  }),
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
  introState.prefersReducedMotion = false;
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
  delete document.documentElement.dataset.introEntering;
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

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(
      section,
      false,
      expect.any(Function),
    );
    expect(introMocks.lockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introEntering).toBe("true");
    expect(introMocks.initIntroScroll).not.toHaveBeenCalled();

    const finishIntro = introMocks.initIntroAnimation.mock.calls[0][2];
    await act(async () => {
      finishIntro();
      await Promise.resolve();
    });

    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      heading: section.querySelector("#intro-title"),
      prefersReducedMotion: false,
    });
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introEntering).toBeUndefined();
  });

  it("로더가 먼저 완료된 경우에는 마운트 직후 진입 애니메이션을 시작한다", async () => {
    markIntroReady();
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(
      section,
      false,
      expect.any(Function),
    );
    expect(introMocks.lockScroll).toHaveBeenCalledOnce();
    expect(introMocks.initIntroScroll).not.toHaveBeenCalled();
  });

  it("진입 중 다른 section 이동은 잠금을 즉시 풀고 Intro를 숨긴다", async () => {
    markIntroReady();
    const section = await mountIntro();
    const startDetail: SectionIntentDetail = {
      id: "contact",
      phase: "start",
    };

    await act(async () => {
      document.dispatchEvent(
        new CustomEvent<SectionIntentDetail>(SECTION_INTENT_EVENT, {
          detail: startDetail,
        }),
      );
    });

    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introEntering).toBeUndefined();
    expect(section.dataset.introEntryMuted).toBe("true");
    expect(introMocks.initIntroScroll).not.toHaveBeenCalled();

    await act(async () => {
      document.dispatchEvent(
        new CustomEvent<SectionIntentDetail>(SECTION_INTENT_EVENT, {
          detail: { id: "contact", phase: "end" },
        }),
      );
    });

    expect(section.dataset.introEntryMuted).toBeUndefined();
  });

  it("reduced motion에서는 진입 중 스크롤을 잠그지 않는다", async () => {
    introState.prefersReducedMotion = true;
    markIntroReady();
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(
      section,
      true,
      expect.any(Function),
    );
    expect(introMocks.lockScroll).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.introEntering).toBeUndefined();

    const finishIntro = introMocks.initIntroAnimation.mock.calls[0][2];
    await act(async () => {
      finishIntro();
      await Promise.resolve();
    });

    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      heading: section.querySelector("#intro-title"),
      prefersReducedMotion: true,
    });
    expect(introMocks.unlockScroll).not.toHaveBeenCalled();
  });
});
