import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ComponentPropsWithoutRef } from "react";
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
import { Skills } from "./Skills";

const skillsMocks = vi.hoisted(() => ({
  initSkillsIntro: vi.fn(),
  initSkillsVisual: vi.fn(),
  lockScroll: vi.fn(),
  prefersReducedMotion: false,
  register: vi.fn(),
  unlockScroll: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock("@/data/portfolio", () => ({
  portfolio: {
    skills: [
      {
        title: "Product UI",
        tools: ["React", "TypeScript"],
        summary: "사용자 흐름을 화면 구조로 만듭니다.",
        projects: [{ label: "모음.zip", slug: "moum-zip" }],
        evidence: "컴포넌트를 기능별로 나눴습니다.",
      },
      {
        title: "Data & State",
        tools: ["TanStack Query", "Zustand"],
        summary: "데이터와 상태 기준을 나눕니다.",
        projects: [
          { label: "모음.zip", slug: "moum-zip" },
          { label: "K-Festival", slug: "k-festival" },
        ],
        evidence: "중복 요청을 줄였습니다.",
      },
      {
        title: "Performance & SEO",
        tools: ["Next.js", "Sitemap"],
        summary: "속도와 검색 경로를 점검합니다.",
        projects: [{ label: "모음.zip", slug: "moum-zip" }],
        evidence: "LCP를 개선했습니다.",
      },
      {
        title: "Motion & Interaction",
        tools: ["Framer Motion", "GSAP"],
        summary: "읽기 흐름을 보조하는 전환을 설계합니다.",
        projects: [
          { label: "개인 포트폴리오" },
          { label: "K-Festival", slug: "k-festival" },
        ],
        evidence: "가독성을 유지했습니다.",
      },
      {
        title: "Delivery & Reliability",
        tools: ["Vitest", "Vercel"],
        summary: "검증과 배포 흐름을 지킵니다.",
        projects: [{ label: "Yajoba", slug: "yajoba" }],
        evidence: "배포 이슈를 안정화했습니다.",
      },
    ],
  },
}));

vi.mock("@/components/common/TransitionLink", () => ({
  TransitionLink: ({
    href,
    label,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { href: string; label: string }) => (
    <a {...props} href={href} data-transition-label={label} />
  ),
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({
    register: skillsMocks.register,
    unregister: skillsMocks.unregister,
  }),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({
    lockScroll: skillsMocks.lockScroll,
    prefersReducedMotion: skillsMocks.prefersReducedMotion,
    unlockScroll: skillsMocks.unlockScroll,
  }),
}));

vi.mock("@/lib/animation/skillsVisual", () => ({
  initSkillsVisual: skillsMocks.initSkillsVisual,
}));

vi.mock("@/lib/animation/skillsIntro", () => ({
  initSkillsIntro: skillsMocks.initSkillsIntro,
}));

let mountedRoots: Root[] = [];
let mediaMatches = false;
let mediaListener: (() => void) | null = null;

beforeAll(() => {
  // React 19가 테스트 환경의 act 호출을 공식 지원하도록 전역 플래그를 활성화한다.
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  // 다른 테스트 파일에 React act 환경 설정이 새지 않도록 전역 플래그를 제거한다.
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

// 컴포넌트를 실제 React root에 마운트해 정적 DOM과 registry effect를 확인한다.
const mountSkills = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(<Skills />);
  });

  return { container, root };
};

// 언마운트로 section registry cleanup 계약을 실행한다.
const unmountSkills = async (root: Root) => {
  await act(async () => {
    root.unmount();
  });
  mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);
};

beforeEach(() => {
  skillsMocks.initSkillsIntro.mockReset();
  skillsMocks.initSkillsIntro.mockResolvedValue(vi.fn());
  skillsMocks.initSkillsVisual.mockReset();
  skillsMocks.initSkillsVisual.mockResolvedValue(vi.fn());
  skillsMocks.register.mockReset();
  skillsMocks.unregister.mockReset();
  skillsMocks.prefersReducedMotion = false;
  mediaMatches = false;
  mediaListener = null;
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
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => {
      root.unmount();
    });
  }
  mountedRoots = [];
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Skills Snap Tabs", () => {
  it("인트로, 기술 보드, 다섯 개 Snap Tabs와 하나의 활성 서사를 렌더링한다", async () => {
    const { container } = await mountSkills();
    const section = container.querySelector("#skills");
    const grid = container.querySelector(".skills-expertise-grid");
    const intro = container.querySelector("[data-skill-intro]");
    const visual = container.querySelector(".skills-expertise-visual");
    const photo = container.querySelector("[data-skill-photo] img");
    const board = container.querySelector("[data-skill-board]");
    const deck = container.querySelector("[data-skill-deck]");
    const deckPages = container.querySelectorAll("[data-skill-deck-page]");
    const deckStatus = container.querySelector("[data-skill-deck-status]");
    const content = container.querySelector(".skills-expertise-content");
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const tablist = container.querySelector(".skills-mobile-tabs");
    const dots = container.querySelectorAll(".skills-mobile-dot");

    expect(section?.getAttribute("tabindex")).toBe("-1");
    expect(section?.getAttribute("aria-labelledby")).toBe("skills-title");
    expect(
      container.querySelector("#skills-title")?.getAttribute("aria-label"),
    ).toBe("구현부터 배포까지, 프론트엔드 역량");
    expect(
      container.querySelectorAll("[data-skill-title-line]"),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll("[data-skill-title-char]"),
    ).toHaveLength(18);
    expect(grid?.children[0]).toBe(intro);
    expect(grid?.children[1]).toBe(visual);
    expect(grid?.children[2]).toBe(content);
    expect(photo?.getAttribute("alt")).toBe("");
    expect(photo?.getAttribute("src")).toContain("skills-editorial-v2.webp");
    expect(visual?.hasAttribute("aria-hidden")).toBe(false);
    expect(board?.getAttribute("role")).toBe("group");
    expect(board?.getAttribute("tabindex")).toBe("0");
    expect(board?.getAttribute("aria-labelledby")).toBe("skills-stack-label");
    expect(board?.contains(tablist)).toBe(true);
    expect(deck?.getAttribute("role")).toBe("region");
    expect(deck?.getAttribute("aria-label")).toBe("역량별 기술 스택");
    expect(deckPages).toHaveLength(5);
    expect(deckStatus?.textContent).toBe("01 / 05");
    expect(
      container.querySelector("#skills-stack-label")?.textContent,
    ).toBe("Selected stack");
    expect(tablist?.getAttribute("role")).toBe("tablist");
    expect(tablist?.getAttribute("aria-label")).toBe("역량 선택");
    expect(tabs).toHaveLength(5);
    expect(tabs[0]?.id).toBe("skill-tab-0");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[0]?.getAttribute("aria-controls")).toBe("skill-panel-0");
    expect(tabs[0]?.tabIndex).toBe(0);
    expect(tabs[1]?.id).toBe("skill-tab-1");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("false");
    expect(tabs[1]?.getAttribute("aria-controls")).toBe("skill-panel-1");
    expect(tabs[1]?.tabIndex).toBe(-1);
    expect(dots).toHaveLength(5);
    for (const dot of dots) {
      expect(dot.getAttribute("aria-hidden")).toBe("true");
    }
    expect(panels).toHaveLength(5);
    expect(panels[0]?.getAttribute("role")).toBe("tabpanel");
    expect(panels[0]?.getAttribute("aria-labelledby")).toBe("skill-tab-0");
    expect(panels[0]?.getAttribute("aria-hidden")).toBe("false");
    expect(
      Array.from(panels).filter(
        (panel) => panel.getAttribute("data-open") === "true",
      ),
    ).toHaveLength(1);
    expect(panels[0]?.textContent).toContain("Product UI");
    expect(container.querySelectorAll("[data-skill-tool]")).toHaveLength(10);
    expect(
      container.querySelectorAll("[data-skill-tool] .skills-tool-logo"),
    ).toHaveLength(10);
    expect(
      container.querySelectorAll("[data-skill-tool] .sr-only"),
    ).toHaveLength(10);
    for (const capability of panels) {
      expect(capability.querySelector(".skills-capability-tools")).not.toBeNull();
      expect(capability.textContent).toContain("적용 프로젝트");
      expect(capability.textContent).toContain("결과");
    }
    expect(
      panels[1]?.querySelector('a[href="/projects/moum-zip"]'),
    ).not.toBeNull();
    expect(
      panels[3]?.querySelector('a[href="/projects/k-festival"]'),
    ).not.toBeNull();
    expect(panels[3]?.textContent).toContain("개인 포트폴리오");
    expect(panels[0]?.textContent).toContain("사용자 흐름을 화면 구조로 만듭니다.");
    expect(panels[2]?.textContent).toContain("LCP를 개선했습니다.");
    expect(panels[4]?.textContent).toContain("배포 이슈를 안정화했습니다.");
  });

  it("탭 클릭은 문서를 스크롤하지 않고 기술 보드와 활성 서사를 함께 선택한다", async () => {
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const panelViewport = container.querySelector<HTMLDivElement>(
      "[data-skill-panels]",
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");
    const status = container.querySelector("[data-skill-deck-status]");
    const deckScrollTo = vi.fn();
    const panelScrollTo = vi.fn();
    const documentScrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.defineProperty(panelViewport, "clientWidth", {
      configurable: true,
      value: 360,
    });
    Object.assign(deck ?? {}, { scrollTo: deckScrollTo });
    Object.assign(panelViewport ?? {}, { scrollTo: panelScrollTo });

    await act(async () => {
      tabs[3]?.click();
    });

    expect(status?.textContent).toBe("04 / 05");
    expect(tabs[3]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[3]?.tabIndex).toBe(0);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("false");
    expect(tabs[0]?.tabIndex).toBe(-1);
    expect(panels[3]?.getAttribute("aria-hidden")).toBe("false");
    expect(panels[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(deckScrollTo).toHaveBeenCalledWith({ behavior: "smooth", left: 960 });
    expect(panelScrollTo).toHaveBeenCalledWith({
      behavior: "smooth",
      left: 1080,
    });
    expect(documentScrollTo).not.toHaveBeenCalled();
  });

  it("보드와 서사 스와이프를 반대쪽 표면 및 선택 상태와 동기화한다", async () => {
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const panelViewport = container.querySelector<HTMLDivElement>(
      "[data-skill-panels]",
    );
    const status = container.querySelector("[data-skill-deck-status]");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");
    const deckScrollTo = vi.fn();
    const panelScrollTo = vi.fn();

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.defineProperty(panelViewport, "clientWidth", {
      configurable: true,
      value: 360,
    });
    Object.assign(deck ?? {}, { scrollLeft: 640, scrollTo: deckScrollTo });
    Object.assign(panelViewport ?? {}, {
      scrollLeft: 0,
      scrollTo: panelScrollTo,
    });

    await act(async () => {
      deck?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(status?.textContent).toBe("03 / 05");
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[2]?.getAttribute("aria-hidden")).toBe("false");
    expect(panelScrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 720,
    });

    Object.assign(panelViewport ?? {}, { scrollLeft: 720 });
    await act(async () => {
      panelViewport?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(deckScrollTo).not.toHaveBeenCalled();
    expect(panelScrollTo).toHaveBeenCalledOnce();

    Object.assign(panelViewport ?? {}, { scrollLeft: 360 });
    await act(async () => {
      panelViewport?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      panelViewport?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(status?.textContent).toBe("02 / 05");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[1]?.getAttribute("aria-hidden")).toBe("false");
    expect(deckScrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 320,
    });

    Object.assign(deck ?? {}, { scrollLeft: 320 });
    await act(async () => {
      deck?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(deckScrollTo).toHaveBeenCalledOnce();
    expect(panelScrollTo).toHaveBeenCalledOnce();
  });

  it("프로그램 대상 페이지 전의 중간 스크롤로 활성 상태가 깜빡이지 않는다", async () => {
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const status = container.querySelector("[data-skill-deck-status]");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");
    const scrollTo = vi.fn();

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.assign(deck ?? {}, { scrollTo });

    await act(async () => {
      tabs[4]?.click();
    });

    expect(status?.textContent).toBe("05 / 05");
    expect(tabs[4]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[4]?.getAttribute("aria-hidden")).toBe("false");
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 1280 });

    Object.assign(deck ?? {}, { scrollLeft: 960 });
    await act(async () => {
      deck?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(status?.textContent).toBe("05 / 05");
    expect(tabs[4]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[4]?.getAttribute("aria-hidden")).toBe("false");

    await act(async () => {
      deck?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      deck?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(status?.textContent).toBe("04 / 05");
    expect(tabs[3]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[3]?.getAttribute("aria-hidden")).toBe("false");
  });

  it("reduced motion에서는 탭 선택 시 보드를 즉시 이동한다", async () => {
    skillsMocks.prefersReducedMotion = true;
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const panelViewport = container.querySelector<HTMLDivElement>(
      "[data-skill-panels]",
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const deckScrollTo = vi.fn();
    const panelScrollTo = vi.fn();

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.defineProperty(panelViewport, "clientWidth", {
      configurable: true,
      value: 360,
    });
    Object.assign(deck ?? {}, { scrollTo: deckScrollTo });
    Object.assign(panelViewport ?? {}, { scrollTo: panelScrollTo });

    await act(async () => {
      tabs[3]?.click();
    });

    expect(tabs[3]?.getAttribute("aria-selected")).toBe("true");
    expect(deckScrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 960 });
    expect(panelScrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 1080 });
  });

  it("키보드로 탭을 선택하고 roving focus를 이동한다", async () => {
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.assign(deck ?? {}, { scrollTo: vi.fn() });
    tabs[0]?.focus();

    await act(async () => {
      tabs[0]?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
      );
    });

    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[1]?.getAttribute("aria-hidden")).toBe("false");

    await act(async () => {
      tabs[1]?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      );
    });

    expect(document.activeElement).toBe(tabs[4]);
    expect(tabs[4]?.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      tabs[4]?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
      );
    });

    expect(document.activeElement).toBe(tabs[3]);
    expect(tabs[3]?.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      tabs[3]?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Home" }),
      );
    });

    expect(document.activeElement).toBe(tabs[0]);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("desktop 전환은 모든 서사를 목록으로 복원하고 모바일 탭 의미를 비활성화한다", async () => {
    const { container } = await mountSkills();
    const tablist = container.querySelector(".skills-mobile-tabs");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const content = container.querySelector(".skills-expertise-content");
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");

    expect(content?.getAttribute("role")).toBeNull();
    expect(panels[0]?.getAttribute("role")).toBe("tabpanel");
    expect(panels[1]?.getAttribute("aria-hidden")).toBe("true");

    mediaMatches = true;
    await act(async () => {
      mediaListener?.();
    });

    expect(content?.getAttribute("role")).toBe("list");
    expect(tablist?.getAttribute("aria-hidden")).toBe("true");
    for (const tab of tabs) {
      expect(tab.disabled).toBe(true);
      expect(tab.tabIndex).toBe(-1);
      expect(tab.getAttribute("role")).toBeNull();
      expect(tab.getAttribute("aria-controls")).toBeNull();
      expect(tab.getAttribute("aria-selected")).toBeNull();
    }
    for (const panel of panels) {
      expect(panel.getAttribute("role")).toBe("listitem");
      expect(panel.getAttribute("aria-hidden")).toBe("false");
    }
  });

  it("브레이크포인트 왕복 후 탭과 단일 활성 서사는 보드 페이지를 공유한다", async () => {
    const { container } = await mountSkills();
    const deck = container.querySelector<HTMLDivElement>("[data-skill-deck]");
    const status = container.querySelector("[data-skill-deck-status]");
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      ".skills-mobile-tab",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-skill-panel]");

    Object.defineProperty(deck, "clientWidth", { configurable: true, value: 320 });
    Object.assign(deck ?? {}, { scrollTo: vi.fn() });

    await act(async () => {
      tabs[3]?.click();
    });

    expect(tabs[3]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[3]?.getAttribute("aria-hidden")).toBe("false");

    mediaMatches = true;
    await act(async () => {
      mediaListener?.();
    });

    Object.assign(deck ?? {}, { scrollLeft: 640 });
    await act(async () => {
      deck?.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(status?.textContent).toBe("03 / 05");

    mediaMatches = false;
    await act(async () => {
      mediaListener?.();
    });

    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[2]?.getAttribute("aria-hidden")).toBe("false");
    expect(
      Array.from(panels).filter(
        (panel) => panel.getAttribute("data-open") === "true",
      ),
    ).toEqual([panels[2]]);
  });

  it("section registry를 등록하고 언마운트에서 해제한다", async () => {
    const { root } = await mountSkills();

    expect(skillsMocks.register).toHaveBeenCalledOnce();
    expect(skillsMocks.register.mock.calls[0]?.[0]).toBe("skills");

    await unmountSkills(root);

    expect(skillsMocks.unregister).toHaveBeenCalledWith("skills");
  });

  it("intro와 visual motion을 현재 section에 연결한다", async () => {
    const { container } = await mountSkills();
    const section = container.querySelector("#skills");

    expect(skillsMocks.initSkillsIntro).toHaveBeenCalledWith({
      lockScroll: skillsMocks.lockScroll,
      prefersReducedMotion: false,
      root: section,
      unlockScroll: skillsMocks.unlockScroll,
    });
    expect(skillsMocks.initSkillsVisual).toHaveBeenCalledWith({
      prefersReducedMotion: false,
      root: section,
    });
  });

  it("intro motion 실패 시 정적 패널을 표시한다", async () => {
    const motionError = new Error("motion failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    skillsMocks.initSkillsIntro.mockRejectedValue(motionError);

    const { container } = await mountSkills();
    await act(async () => {
      await Promise.resolve();
    });

    const section = container.querySelector<HTMLElement>("#skills");
    expect(section?.dataset.skillPanelReady).toBe("true");
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Skills intro motion failed"),
      motionError,
    );
  });
});
