import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSkillsIntro } from "@/lib/animation/skillsIntro";

const introMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: introMocks.loadGsap,
}));

function createMedia(initialMatches = true) {
  let listener: (() => void) | null = null;
  const media = {
    matches: initialMatches,
    addEventListener: vi.fn((_type: string, nextListener: () => void) => {
      listener = nextListener;
    }),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    media,
    setMatches(matches: boolean) {
      Object.assign(media, { matches });
      listener?.();
    },
  };
}

function createIntroDom() {
  const root = document.createElement("section");
  Object.defineProperty(root, "clientWidth", { value: 1440 });
  root.innerHTML = `
    <p class="skills-expertise-eyebrow"></p>
    <h2 class="skills-expertise-title"></h2>
    <p class="skills-expertise-description"></p>
    <div class="skills-expertise-visual-inner">
      <div class="skills-expertise-photo"><img alt="" /></div>
    </div>
  `;
  return root;
}

function createHarness() {
  const timelines = Array.from({ length: 2 }, () => {
    const timeline = { kill: vi.fn(), to: vi.fn() };
    timeline.to.mockReturnValue(timeline);
    return timeline;
  });
  const triggers = Array.from({ length: 2 }, () => ({ kill: vi.fn() }));
  const triggerOptions: Array<Record<string, unknown>> = [];
  const gsap = {
    set: vi.fn(),
    timeline: vi
      .fn()
      .mockImplementationOnce(() => timelines[0])
      .mockImplementationOnce(() => timelines[1]),
  };
  const ScrollTrigger = {
    create: vi.fn((options: Record<string, unknown>) => {
      triggerOptions.push(options);
      return triggers[triggerOptions.length - 1];
    }),
    refresh: vi.fn(),
  };
  introMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

  return { gsap, ScrollTrigger, timelines, triggerOptions, triggers };
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initSkillsIntro", () => {
  it("데스크톱에서 중앙 제목과 50:50 분할 timeline을 연결하고 정리한다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsIntro({
      prefersReducedMotion: false,
      root,
    });

    expect(root.dataset.skillEntry).toBe("active");
    expect(harness.triggerOptions).toEqual([
      expect.objectContaining({ end: "top 12%", start: "top 78%" }),
      expect.objectContaining({ end: "top -70%", start: "top top" }),
    ]);
    expect(harness.timelines[0]?.to).toHaveBeenCalledOnce();
    expect(harness.timelines[1]?.to).toHaveBeenCalledTimes(5);

    media.setMatches(false);
    expect(root.dataset.skillEntry).toBeUndefined();
    harness.triggers.forEach((trigger) => {
      expect(trigger.kill).toHaveBeenCalledOnce();
    });
    expect(harness.gsap.set).toHaveBeenLastCalledWith(expect.any(Array), {
      clearProps:
        "opacity,visibility,x,y,scale,transformOrigin,willChange,clipPath",
    });

    cleanup();
  });

  it("reduced motion과 필수 DOM 누락에서는 정적 상태를 유지한다", async () => {
    const reducedCleanup = await initSkillsIntro({
      prefersReducedMotion: true,
      root: createIntroDom(),
    });
    const staticCleanup = await initSkillsIntro({
      prefersReducedMotion: false,
      root: document.createElement("section"),
    });

    expect(introMocks.loadGsap).not.toHaveBeenCalled();
    expect(() => reducedCleanup()).not.toThrow();
    expect(() => staticCleanup()).not.toThrow();
  });
});
