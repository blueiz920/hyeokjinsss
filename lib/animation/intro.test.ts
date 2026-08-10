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
    <div class="intro-context" data-intro-item></div>
    <ul class="intro-proof-list" data-intro-item></ul>
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
  it("두 역할 줄을 함께 시작하고 name과 supporting blocks를 뒤이어 reveal한다", async () => {
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
      { y: 0, yPercent: 80 },
      expect.objectContaining({
        duration: 1.25,
        ease: entryEase,
        stagger: 0.06,
        y: 0,
        yPercent: 0,
      }),
      0.46,
    ]);
    expect(timeline.fromTo.mock.calls[1]?.[3]).toBe(0.46);
    expect(timeline.fromTo.mock.calls[2]).toEqual([
      root.querySelectorAll(".intro-name [data-intro-char]"),
      { y: 0, yPercent: 80 },
      expect.objectContaining({ y: 0, yPercent: 0 }),
      0.64,
    ]);
    expect(timeline.to).toHaveBeenCalledTimes(2);
    expect(timeline.to.mock.calls[0]).toEqual([
      root.querySelector(".intro-context"),
      expect.objectContaining({
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.65,
        y: 0,
      }),
      1.5,
    ]);
    expect(timeline.to.mock.calls[1]?.[2]).toBe(1.57);

    cleanup();
    expect(timeline.revert).toHaveBeenCalledOnce();
    expect(timeline.kill).toHaveBeenCalledOnce();
  });

  it("일반 모션 cleanup 뒤 reduced motion으로 재진입해도 글자 inline transform을 남기지 않는다", async () => {
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

  it("showIntro는 실패 뒤 모든 Intro 요소를 최종 가시 상태로 복원한다", () => {
    const root = createEntryDom();
    const char = root.querySelector<HTMLElement>("[data-intro-char]")!;
    const context = root.querySelector<HTMLElement>(".intro-context")!;
    const proof = root.querySelector<HTMLElement>(".intro-proof-list")!;
    char.style.transform = "translate(0%, 80%)";
    char.style.willChange = "transform";
    context.style.clipPath = "inset(100% 0% 0% 0%)";
    context.style.transform = "translateY(1.25rem)";
    proof.style.willChange = "clip-path";

    showIntro(root);

    root.querySelectorAll<HTMLElement>("[data-intro-item]").forEach((item) => {
      expect(item.style.opacity).toBe("1");
    });
    expect(char.style.transform).toBe("none");
    expect(char.style.willChange).toBe("auto");
    [context, proof].forEach((item) => {
      expect(item.style.clipPath).toBe("none");
      expect(item.style.transform).toBe("none");
      expect(item.style.willChange).toBe("auto");
    });
  });

  it("reduced motion에서는 GSAP을 시작하지 않고 즉시 완료한다", async () => {
    const onComplete = vi.fn();

    const cleanup = await initIntroAnimation(createEntryDom(), true, onComplete);

    expect(introMocks.loadGsap).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(() => cleanup()).not.toThrow();
  });
});
