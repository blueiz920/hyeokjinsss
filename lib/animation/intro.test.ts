import { afterEach, describe, expect, it, vi } from "vitest";
import { initIntroAnimation, showIntro } from "./intro";

const introMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: introMocks.loadGsap,
}));

const createEntryDom = () => {
  const root = document.createElement("section");
  root.innerHTML = `
    <h1 class="intro-role" data-intro-item>
      <span data-intro-role-line><span data-intro-char>F</span></span>
      <span data-intro-role-line><span data-intro-char>D</span></span>
    </h1>
    <div class="intro-pull-stage" data-intro-item></div>
    <p class="intro-name" data-intro-item><span data-intro-char>H</span></p>
  `;
  return root;
};

const createHarness = () => {
  const timeline = {
    fromTo: vi.fn(),
    kill: vi.fn(),
    revert: vi.fn(),
    to: vi.fn(),
  };
  timeline.to.mockReturnValue(timeline);
  timeline.fromTo.mockReturnValue(timeline);
  const gsap = {
    timeline: vi.fn(() => timeline),
  };
  const entryEase = { ease: true };
  const CustomEase = {
    create: vi.fn(() => entryEase),
  };
  introMocks.loadGsap.mockResolvedValue({ gsap, CustomEase });
  return { CustomEase, entryEase, gsap, timeline };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("initIntroAnimation", () => {
  it("두 역할 줄을 함께 시작하고 이름과 당김 동작 요소를 뒤이어 드러낸다", async () => {
    const root = createEntryDom();
    const { CustomEase, entryEase, gsap, timeline } = createHarness();
    const onComplete = vi.fn();

    const cleanup = await initIntroAnimation(root, false, onComplete);

    expect(gsap.timeline).toHaveBeenCalledWith({ onComplete });
    expect(CustomEase.create).toHaveBeenCalledWith(
      "intro-entry",
      "0.62, 0.05, 0.01, 0.99",
    );
    expect(timeline.fromTo).toHaveBeenCalledTimes(3);
    expect(timeline.fromTo.mock.calls[0]).toEqual([
      root.querySelectorAll("[data-intro-role-line]")[0]?.querySelectorAll(
        "[data-intro-char]",
      ),
      { y: 0, yPercent: 110 },
      expect.objectContaining({
        duration: 1.25,
        ease: entryEase,
        stagger: 0.06,
        y: 0,
        yPercent: 0,
      }),
      0.06,
    ]);
    expect(timeline.fromTo.mock.calls[1]?.[3]).toBe(0.06);
    expect(timeline.fromTo.mock.calls[2]).toEqual([
      root.querySelectorAll(".intro-name [data-intro-char]"),
      { y: 0, yPercent: 110 },
      expect.objectContaining({ y: 0, yPercent: 0 }),
      0.18,
    ]);
    expect(timeline.to).toHaveBeenCalledOnce();
    expect(timeline.to.mock.calls[0]).toEqual([
      root.querySelector(".intro-pull-stage"),
      expect.objectContaining({
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.65,
        y: 0,
      }),
      1.5,
    ]);

    cleanup();
    expect(timeline.revert).toHaveBeenCalledOnce();
    expect(timeline.kill).toHaveBeenCalledOnce();
  });

  it("일반 모션 정리 뒤 모션 축소로 재진입해도 글자 인라인 변형을 남기지 않는다", async () => {
    const root = createEntryDom();
    const char = root.querySelector<HTMLElement>("[data-intro-char]")!;
    char.style.transform = "translate(0%, 80%)";
    const { timeline } = createHarness();
    timeline.revert.mockImplementation(() => {
      char.style.removeProperty("transform");
    });

    const cleanup = await initIntroAnimation(root, false);
    cleanup();
    await initIntroAnimation(root, true);

    expect(timeline.revert).toHaveBeenCalledOnce();
    expect(char.style.transform).toBe("");
  });

  it("인트로 표시 함수는 실패 뒤 모든 인트로 요소를 최종 가시 상태로 복원한다", () => {
    const root = createEntryDom();
    const char = root.querySelector<HTMLElement>("[data-intro-char]")!;
    const pull = root.querySelector<HTMLElement>(".intro-pull-stage")!;
    char.style.transform = "translate(0%, 80%)";
    char.style.willChange = "transform";
    pull.style.clipPath = "inset(0% 50% 0% 50%)";
    pull.style.transform = "translateY(0.75rem)";
    pull.style.willChange = "clip-path";

    showIntro(root);

    root.querySelectorAll<HTMLElement>("[data-intro-item]").forEach((item) => {
      expect(item.style.opacity).toBe("1");
    });
    expect(char.style.transform).toBe("none");
    expect(char.style.willChange).toBe("auto");
    expect(pull.style.clipPath).toBe("none");
    expect(pull.style.transform).toBe("none");
    expect(pull.style.willChange).toBe("auto");
  });

  it("모션 축소 환경에서는 GSAP을 시작하지 않고 즉시 완료한다", async () => {
    const onComplete = vi.fn();

    const cleanup = await initIntroAnimation(createEntryDom(), true, onComplete);

    expect(introMocks.loadGsap).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(() => cleanup()).not.toThrow();
  });
});
