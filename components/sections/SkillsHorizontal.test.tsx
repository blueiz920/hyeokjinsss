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
import { SkillsHorizontal } from "./SkillsHorizontal";

const skillsMocks = vi.hoisted(() => ({
  initBackgroundMotion: vi.fn(),
  initHorizontalMotion: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock("@/data/portfolio", () => ({
  portfolio: {
    skills: [
      {
        approach: "테스트 접근",
        problem: "테스트 문제",
        result: "테스트 결과",
        title: "테스트 기술",
      },
    ],
  },
}));

vi.mock("@/hooks/useScrollRuntime", () => ({
  useScrollRuntime: () => ({ prefersReducedMotion: false }),
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({
    register: skillsMocks.register,
    unregister: skillsMocks.unregister,
  }),
}));

vi.mock("@/lib/animation/skillsBackground", () => ({
  initSkillsBackgroundMotion: skillsMocks.initBackgroundMotion,
}));

vi.mock("@/lib/animation/skillsHorizontal", () => ({
  initSkillsHorizontal: skillsMocks.initHorizontalMotion,
}));

let mountedRoots: Root[] = [];
let backgroundCleanup = vi.fn();
let horizontalCleanup = vi.fn();

beforeAll(() => {
  // React 19가 테스트 환경의 act 호출을 공식 지원하도록 전역 플래그를 활성화한다.
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  // 다른 테스트 파일에 React act 환경 설정이 새지 않도록 전역 플래그를 제거한다.
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

// 컴포넌트를 실제 React root에 마운트하고 비동기 초기화 결과까지 반영한다.
const mountSkills = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(<SkillsHorizontal />);
    await Promise.resolve();
    await Promise.resolve();
  });

  return { container, root };
};

// 언마운트로 두 모션 effect의 cleanup 계약을 실행한다.
const unmountSkills = async (root: Root) => {
  await act(async () => {
    root.unmount();
  });
  mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);
};

beforeEach(() => {
  backgroundCleanup = vi.fn();
  horizontalCleanup = vi.fn();
  skillsMocks.initBackgroundMotion
    .mockReset()
    .mockResolvedValue(backgroundCleanup);
  skillsMocks.initHorizontalMotion
    .mockReset()
    .mockResolvedValue(horizontalCleanup);
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

describe("SkillsHorizontal motion fallback", () => {
  it("정상 초기화에서는 가로 배치를 유지하고 두 모션을 정리한다", async () => {
    const { container, root } = await mountSkills();

    expect(
      container.querySelector(".skills-pin")?.getAttribute("data-layout"),
    ).toBe("horizontal");

    await unmountSkills(root);

    expect(horizontalCleanup).toHaveBeenCalledOnce();
    expect(backgroundCleanup).toHaveBeenCalledOnce();
  });

  it("가로 모션 초기화 실패 시 정적 배치로 전환하고 배경은 유지한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    skillsMocks.initHorizontalMotion.mockRejectedValue(
      new Error("horizontal load failed"),
    );

    const { container, root } = await mountSkills();

    expect(
      container.querySelector(".skills-pin")?.getAttribute("data-layout"),
    ).toBe("static");
    expect(skillsMocks.initBackgroundMotion).toHaveBeenCalledOnce();

    await unmountSkills(root);

    expect(backgroundCleanup).toHaveBeenCalledOnce();
  });

  it("배경 모션 초기화 실패를 처리하고 가로 배치는 유지한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    skillsMocks.initBackgroundMotion.mockRejectedValue(
      new Error("background load failed"),
    );

    const { container, root } = await mountSkills();

    expect(
      container.querySelector(".skills-pin")?.getAttribute("data-layout"),
    ).toBe("horizontal");
    expect(consoleError).toHaveBeenCalledOnce();

    await unmountSkills(root);

    expect(horizontalCleanup).toHaveBeenCalledOnce();
  });
});
