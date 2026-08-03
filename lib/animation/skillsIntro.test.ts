import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSkillsIntro } from "@/lib/animation/skillsIntro";

const introMocks = vi.hoisted(() => ({
  Flip: {
    from: vi.fn(),
    getState: vi.fn(),
  },
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: introMocks.loadGsap,
}));

vi.mock("gsap/dist/Flip", () => ({
  Flip: introMocks.Flip,
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
    <h2 class="skills-expertise-title">
      <span data-skill-title-line><span data-skill-title-char>문</span></span>
      <span data-skill-title-line><span data-skill-title-char>방</span></span>
    </h2>
    <p class="skills-expertise-description"></p>
    <div class="skills-expertise-visual-inner">
      <div class="skills-expertise-photo"><img alt="" /></div>
    </div>
  `;
  return root;
}

function createHarness() {
  const timeline = {
    add: vi.fn(),
    call: vi.fn(),
    kill: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    progress: vi.fn(),
    to: vi.fn(),
  };
  Object.values(timeline).forEach((method) => method.mockReturnValue(timeline));
  const trigger = { kill: vi.fn() };
  const triggerOptions: Array<Record<string, unknown>> = [];
  const gsap = {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => timeline),
  };
  const ScrollTrigger = {
    create: vi.fn((options: Record<string, unknown>) => {
      triggerOptions.push(options);
      return trigger;
    }),
    refresh: vi.fn(),
  };
  introMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

  return { gsap, ScrollTrigger, timeline, trigger, triggerOptions };
}

beforeEach(() => {
  introMocks.Flip.from.mockReset();
  introMocks.Flip.from.mockReturnValue({ kill: vi.fn() });
  introMocks.Flip.getState.mockReset();
  introMocks.Flip.getState.mockReturnValue({ state: true });
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initSkillsIntro", () => {
  it("데스크톱에서 시간 기반 글자·사진·최종 배치 timeline을 연결한다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsIntro({
      prefersReducedMotion: false,
      root,
    });

    expect(root.dataset.skillEntry).toBe("staged");
    expect(harness.triggerOptions).toEqual([
      expect.objectContaining({ once: true, start: "top 5%" }),
    ]);
    expect(harness.timeline.to).toHaveBeenCalledTimes(8);

    const triggerOptions = harness.triggerOptions[0] as {
      onEnter: () => void;
    };
    triggerOptions.onEnter();
    expect(harness.timeline.play).toHaveBeenCalledOnce();

    const layoutCall = harness.timeline.call.mock.calls[0]?.[0] as () => void;
    layoutCall();
    expect(root.dataset.skillEntry).toBe("complete");
    expect(introMocks.Flip.getState).toHaveBeenCalledOnce();
    expect(introMocks.Flip.from).toHaveBeenCalledWith(
      { state: true },
      expect.objectContaining({ duration: 1, ease: "power3.inOut" }),
    );

    media.setMatches(false);
    expect(root.dataset.skillEntry).toBeUndefined();
    expect(harness.trigger.kill).toHaveBeenCalledOnce();

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

  it("복원된 스크롤이 진입점을 지난 경우 애니메이션 없이 최종 배치를 적용한다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    await initSkillsIntro({
      prefersReducedMotion: false,
      root,
    });

    const triggerOptions = harness.triggerOptions[0] as {
      onRefresh: (self: { scroll: () => number; start: number }) => void;
    };
    triggerOptions.onRefresh({ scroll: () => 120, start: 100 });

    expect(harness.timeline.kill).toHaveBeenCalledOnce();
    expect(harness.timeline.play).not.toHaveBeenCalled();
    expect(root.dataset.skillEntry).toBe("complete");
  });
});
