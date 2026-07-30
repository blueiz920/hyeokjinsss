import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSkillsVisual } from "@/lib/animation/skillsVisual";

const visualMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: visualMocks.loadGsap,
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

function createVisualDom() {
  const root = document.createElement("section");
  root.innerHTML = `
    <div data-skill-photo></div>
    <div data-skill-board></div>
    <div class="skills-expertise-content"></div>
  `;
  return root;
}

type TriggerOptions = {
  end: string;
  onEnter: () => void;
  onLeaveBack: () => void;
  onRefresh: (self: { scroll: () => number; start: number }) => void;
  start: string;
};

function createMotionHarness() {
  const timeline = {
    kill: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    progress: vi.fn(),
    reverse: vi.fn(),
    to: vi.fn(),
  };
  timeline.to.mockReturnValue(timeline);
  timeline.progress.mockReturnValue(timeline);

  const trigger = {
    kill: vi.fn(),
  };
  let triggerOptions: TriggerOptions | null = null;
  const gsap = {
    set: vi.fn(),
    timeline: vi.fn(() => timeline),
  };
  const ScrollTrigger = {
    create: vi.fn((options: TriggerOptions) => {
      triggerOptions = options;
      return trigger;
    }),
    refresh: vi.fn(),
  };
  visualMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

  return {
    getOptions: () => triggerOptions,
    gsap,
    ScrollTrigger,
    timeline,
    trigger,
  };
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initSkillsVisual", () => {
  it("데스크톱에서 원본 임계점의 가역 교차 전환을 구성한다", async () => {
    const root = createVisualDom();
    const media = createMedia();
    const harness = createMotionHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsVisual({
      prefersReducedMotion: false,
      root,
    });

    expect(harness.ScrollTrigger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        end: "max",
        start: "top -8%",
      }),
    );
    expect(harness.timeline.to).toHaveBeenCalledTimes(2);

    const options = harness.getOptions();
    if (!options) throw new Error("ScrollTrigger options were not captured.");
    options.onEnter();
    expect(harness.timeline.play).toHaveBeenCalledOnce();
    options.onLeaveBack();
    expect(harness.timeline.reverse).toHaveBeenCalledOnce();
    options.onRefresh({ scroll: () => 120, start: 100 });
    expect(harness.timeline.progress).toHaveBeenCalledWith(1);
    expect(harness.timeline.pause).toHaveBeenCalledOnce();

    cleanup();
    expect(harness.trigger.kill).toHaveBeenCalledOnce();
    expect(harness.timeline.kill).toHaveBeenCalledOnce();
  });

  it("예약된 refresh를 실행하고 필수 DOM이 없으면 정적 상태를 유지한다", async () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );

    const media = createMedia();
    const harness = createMotionHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsVisual({
      prefersReducedMotion: false,
      root: createVisualDom(),
    });

    expect(harness.ScrollTrigger.refresh).toHaveBeenCalledOnce();
    cleanup();

    const staticCleanup = await initSkillsVisual({
      prefersReducedMotion: false,
      root: document.createElement("section"),
    });
    expect(() => staticCleanup()).not.toThrow();
  });

  it("모바일 전환 시 inline 상태를 정리하고 정적 보드로 복귀한다", async () => {
    const root = createVisualDom();
    const media = createMedia();
    const harness = createMotionHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsVisual({
      prefersReducedMotion: false,
      root,
    });
    media.setMatches(false);

    expect(harness.trigger.kill).toHaveBeenCalledOnce();
    expect(harness.timeline.kill).toHaveBeenCalledOnce();
    expect(harness.gsap.set).toHaveBeenLastCalledWith(
      expect.any(Array),
      { clearProps: "opacity,visibility" },
    );

    cleanup();
  });

  it("reduced motion에서는 GSAP을 로드하지 않는다", async () => {
    const cleanup = await initSkillsVisual({
      prefersReducedMotion: true,
      root: createVisualDom(),
    });

    expect(visualMocks.loadGsap).not.toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
  });
});
