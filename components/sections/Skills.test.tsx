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
import { Skills } from "./Skills";

const skillsMocks = vi.hoisted(() => ({
  initSkillsIntro: vi.fn(),
  initSkillsVisual: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock("@/data/portfolio", () => ({
  portfolio: {
    skills: [
      {
        title: "Product UI",
        tools: ["React", "TypeScript"],
        summary: "사용자 흐름을 화면 구조로 만듭니다.",
        project: "모음.zip",
        evidence: "컴포넌트를 기능별로 나눴습니다.",
      },
      {
        title: "Data & State",
        tools: ["TanStack Query", "Zustand"],
        summary: "데이터와 상태 기준을 나눕니다.",
        project: "K-Festival",
        evidence: "중복 요청을 줄였습니다.",
      },
      {
        title: "Performance & SEO",
        tools: ["Next.js", "Sitemap"],
        summary: "속도와 검색 경로를 점검합니다.",
        project: "모음.zip",
        evidence: "LCP를 개선했습니다.",
      },
      {
        title: "Motion & Interaction",
        tools: ["Framer Motion", "GSAP"],
        summary: "읽기 흐름을 보조하는 전환을 설계합니다.",
        project: "개인 포트폴리오",
        evidence: "가독성을 유지했습니다.",
      },
      {
        title: "Delivery & Reliability",
        tools: ["Vitest", "Vercel"],
        summary: "검증과 배포 흐름을 지킵니다.",
        project: "Yajoba",
        evidence: "배포 이슈를 안정화했습니다.",
      },
    ],
  },
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({
    register: skillsMocks.register,
    unregister: skillsMocks.unregister,
  }),
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({
    prefersReducedMotion: false,
  }),
}));

vi.mock("@/lib/animation/skillsVisual", () => ({
  initSkillsVisual: skillsMocks.initSkillsVisual,
}));

vi.mock("@/lib/animation/skillsIntro", () => ({
  initSkillsIntro: skillsMocks.initSkillsIntro,
}));

let mountedRoots: Root[] = [];

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
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => {
      root.unmount();
    });
  }
  mountedRoots = [];
  document.body.replaceChildren();
});

describe("Skills static capabilities", () => {
  it("인트로, 포커스 가능한 기술 보드, 다섯 개 역량 서사를 순서대로 렌더링한다", async () => {
    const { container } = await mountSkills();
    const section = container.querySelector("#skills");
    const grid = container.querySelector(".skills-expertise-grid");
    const intro = container.querySelector("[data-skill-intro]");
    const visual = container.querySelector(".skills-expertise-visual");
    const photo = container.querySelector("[data-skill-photo] img");
    const board = container.querySelector("[data-skill-board]");
    const content = container.querySelector(".skills-expertise-content");
    const capabilities = container.querySelectorAll("[data-skill-capability]");

    expect(section?.getAttribute("tabindex")).toBe("-1");
    expect(section?.getAttribute("aria-labelledby")).toBe("skills-title");
    expect(
      container.querySelector("#skills-title")?.getAttribute("aria-label"),
    ).toBe("문제를 해결하는 다섯 가지 방식");
    expect(
      container.querySelectorAll("[data-skill-title-line]"),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll("[data-skill-title-char]"),
    ).toHaveLength(16);
    expect(grid?.children[0]).toBe(intro);
    expect(grid?.children[1]).toBe(visual);
    expect(grid?.children[2]).toBe(content);
    expect(photo?.getAttribute("alt")).toBe("");
    expect(photo?.getAttribute("src")).toContain("skills-editorial-v2.webp");
    expect(visual?.hasAttribute("aria-hidden")).toBe(false);
    expect(board?.getAttribute("role")).toBe("group");
    expect(board?.getAttribute("tabindex")).toBe("0");
    expect(board?.getAttribute("aria-labelledby")).toBe("skills-stack-label");
    expect(
      container.querySelector("#skills-stack-label")?.textContent,
    ).toBe("Selected stack");
    expect(capabilities).toHaveLength(5);
    expect(
      container.querySelectorAll(
        ".skills-expertise-content [data-skill-capability]",
      ),
    ).toHaveLength(5);
    expect(capabilities[0]?.textContent).toContain("Product UI");
    expect(container.querySelectorAll("[data-skill-tool]")).toHaveLength(10);
    expect(
      container.querySelectorAll("[data-skill-tool] .skills-tool-logo"),
    ).toHaveLength(10);
    expect(
      container.querySelectorAll("[data-skill-tool] .sr-only"),
    ).toHaveLength(10);
    for (const capability of capabilities) {
      expect(capability.querySelector(".skills-capability-tools")).not.toBeNull();
      expect(capability.textContent).toContain("적용 프로젝트");
      expect(capability.textContent).toContain("결과");
    }
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
      prefersReducedMotion: false,
      root: section,
    });
    expect(skillsMocks.initSkillsVisual).toHaveBeenCalledWith({
      prefersReducedMotion: false,
      root: section,
    });
  });
});
