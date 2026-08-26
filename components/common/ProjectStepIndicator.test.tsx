import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectStepIndicator } from "./ProjectStepIndicator";

const indicatorState = vi.hoisted(() => ({
  projects: {
    active: false,
    everActive: false,
    step: 0,
    total: 3,
  },
}));

vi.mock("@/hooks/useScrollIndicators", () => ({
  useScrollIndicators: () => indicatorState,
}));

beforeEach(() => {
  indicatorState.projects = {
    active: false,
    everActive: false,
    step: 0,
    total: 3,
  };
});

describe("ProjectStepIndicator", () => {
  it("Projects가 처음 활성화되기 전에는 점을 숨긴다", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ProjectStepIndicator />);

    const dots = container.querySelectorAll("ol")[0]?.querySelectorAll("li");

    expect(dots).toHaveLength(3);
    expect(dots[0]?.className).toContain("opacity-0");
    expect(dots[0]?.getAttribute("style")).toBeNull();
  });

  it("활성 단계와 진입 애니메이션을 Projects 상태에서 표시한다", () => {
    indicatorState.projects = {
      active: true,
      everActive: true,
      step: 1,
      total: 3,
    };

    const container = document.createElement("div");
    container.innerHTML = renderToString(<ProjectStepIndicator />);
    const dots = container.querySelectorAll("ol")[0]?.querySelectorAll("li");

    expect(dots[1]?.querySelector("span")?.className).toContain("bg-amber-300");
    expect(dots[0]?.getAttribute("style")).toContain(
      "animation-name:sp-dot-in",
    );
  });

  it("활성화 이후 비활성화되면 역순 퇴장 애니메이션을 실행한다", () => {
    indicatorState.projects = {
      active: false,
      everActive: true,
      step: 2,
      total: 3,
    };

    const container = document.createElement("div");
    container.innerHTML = renderToString(<ProjectStepIndicator />);
    const dots = container.querySelectorAll("ol")[0]?.querySelectorAll("li");

    expect(dots[0]?.getAttribute("style")).toContain(
      "animation-name:sp-dot-out",
    );
    expect(dots[0]?.getAttribute("style")).toContain("animation-delay:150ms");
    expect(dots[2]?.getAttribute("style")).toContain("animation-delay:0ms");
  });
});
