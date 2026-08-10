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
import { portfolio } from "@/data/portfolio";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";
import { Intro } from "./Intro";

const introMocks = vi.hoisted(() => ({
  initIntroAnimation: vi.fn(),
  initIntroPull: vi.fn(),
  initIntroScroll: vi.fn(),
  register: vi.fn(),
  scrollTo: vi.fn(),
  showIntro: vi.fn(),
  unlockScroll: vi.fn(),
  unregister: vi.fn(),
}));

const introState = vi.hoisted(() => ({
  prefersReducedMotion: false,
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({
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
  showIntro: introMocks.showIntro,
}));

vi.mock("@/lib/animation/introPull", () => ({
  initIntroPull: introMocks.initIntroPull,
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
  document.documentElement.dataset.introLocked = "true";
  delete document.documentElement.dataset.introReady;
  introState.prefersReducedMotion = false;
  Object.values(introMocks).forEach((mock) => mock.mockReset());
  introMocks.initIntroAnimation.mockResolvedValue(vi.fn());
  introMocks.initIntroPull.mockResolvedValue(vi.fn());
  introMocks.initIntroScroll.mockResolvedValue(vi.fn());
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.introEntering;
  delete document.documentElement.dataset.introLocked;
  delete document.documentElement.dataset.introReady;
});

describe("Intro readiness", () => {
  it("완성 텍스트는 한 번만 노출하고 시각 글자는 mask 안에 둔다", async () => {
    const section = await mountIntro();
    const role = section.querySelector(".intro-role");
    const name = section.querySelector(".intro-name");
    const roleLines = section.querySelectorAll("[data-intro-role-line]");
    const visualChars = section.querySelectorAll("[data-intro-char]");

    expect(role?.querySelector(".sr-only")?.textContent).toBe(
      `${portfolio.introHeadline.accent} ${portfolio.introHeadline.rest}`,
    );
    expect(name?.querySelector(".sr-only")?.textContent).toBe(
      portfolio.introEyebrow,
    );
    expect(roleLines).toHaveLength(2);
    roleLines.forEach((line) => {
      expect(line.getAttribute("aria-hidden")).toBe("true");
    });
    expect(name?.querySelector(".intro-name-visual")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(visualChars).toHaveLength(
      Array.from(portfolio.introHeadline.accent).length +
        Array.from(portfolio.introHeadline.rest).length +
        Array.from(portfolio.introEyebrow).length,
    );
    visualChars.forEach((character) => {
      expect(character.parentElement?.classList.contains("intro-char-cell")).toBe(
        true,
      );
      expect(character.closest(".intro-line-mask")).not.toBeNull();
    });
  });

  it("설명·성과·연락 CTA 대신 당김 CTA 하나로 Projects 이동을 제공한다", async () => {
    const section = await mountIntro();
    const pull = section.querySelector<HTMLButtonElement>(".intro-pull")!;

    expect(section.querySelector(".intro-statement")).toBeNull();
    expect(section.querySelector(".intro-proof-list")).toBeNull();
    expect(section.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(pull.getAttribute("aria-label")).toBe("프로젝트 보기");
    expect(pull.querySelector("[data-pull-label]")?.textContent).toBe("PULL!");
    expect(introMocks.initIntroPull).toHaveBeenCalledWith({
      root: pull,
      onDrop: expect.any(Function),
      prefersReducedMotion: false,
    });

    await act(async () => pull.click());

    expect(introMocks.scrollTo).toHaveBeenCalledOnce();
    expect(introMocks.scrollTo).toHaveBeenCalledWith("projects");
  });

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
    expect(document.documentElement.dataset.introEntering).toBe("true");
    expect(introMocks.initIntroScroll).not.toHaveBeenCalled();

    const finishIntro = introMocks.initIntroAnimation.mock.calls[0][2];
    await act(async () => {
      finishIntro();
      await Promise.resolve();
    });

    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      prefersReducedMotion: false,
    });
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.introEntering).toBeUndefined();
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
  });

  it("로더가 먼저 완료된 경우에는 마운트 직후 진입 애니메이션을 시작한다", async () => {
    markIntroReady();
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(
      section,
      false,
      expect.any(Function),
    );
    expect(introMocks.initIntroScroll).not.toHaveBeenCalled();
  });

  it("entry animation 실패 시 Intro를 최종 가시 상태로 복원한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    introMocks.initIntroAnimation.mockRejectedValueOnce(new Error("GSAP failed"));
    markIntroReady();
    const section = await mountIntro();

    await act(async () => {
      await Promise.resolve();
    });

    expect(introMocks.showIntro).toHaveBeenCalledWith(section);
    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      prefersReducedMotion: false,
    });
    errorSpy.mockRestore();
  });

  it("fallback은 실행 중인 entry timeline을 중단하고 한 번만 최종 상태를 복원한다", async () => {
    vi.useFakeTimers();
    const dispose = vi.fn();
    introMocks.initIntroAnimation.mockResolvedValue(dispose);
    markIntroReady();
    const section = await mountIntro();

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(dispose).toHaveBeenCalledOnce();
    expect(introMocks.showIntro).toHaveBeenCalledOnce();
    expect(introMocks.showIntro).toHaveBeenCalledWith(section);
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      prefersReducedMotion: false,
    });
    vi.useRealTimers();
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
    expect(document.documentElement.dataset.introLocked).toBeUndefined();
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
    delete document.documentElement.dataset.introLocked;
    markIntroReady();
    const section = await mountIntro();

    expect(introMocks.initIntroAnimation).toHaveBeenCalledWith(
      section,
      true,
      expect.any(Function),
    );
    expect(document.documentElement.dataset.introEntering).toBeUndefined();

    const finishIntro = introMocks.initIntroAnimation.mock.calls[0][2];
    await act(async () => {
      finishIntro();
      await Promise.resolve();
    });

    expect(introMocks.initIntroScroll).toHaveBeenCalledWith({
      root: section,
      prefersReducedMotion: true,
    });
    expect(introMocks.unlockScroll).not.toHaveBeenCalled();
  });
});
