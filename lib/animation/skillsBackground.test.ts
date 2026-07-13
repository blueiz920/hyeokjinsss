import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSkillsBackgroundMotion } from "@/lib/animation/skillsBackground";

const motionMocks = vi.hoisted(() => ({
  applyActiveState: vi.fn(),
  applyReducedState: vi.fn(),
  clearRevealState: vi.fn(),
  clearRunnerStyles: vi.fn(),
  createRevealTimeline: vi.fn(),
  createRunnerTimelines: vi.fn(),
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: motionMocks.loadGsap,
}));

vi.mock("@/lib/animation/skillsRunner", () => ({
  clearRunnerStyles: motionMocks.clearRunnerStyles,
  createRunnerTimelines: motionMocks.createRunnerTimelines,
}));

vi.mock("@/lib/animation/skillsReveal", () => ({
  applyActiveState: motionMocks.applyActiveState,
  applyReducedState: motionMocks.applyReducedState,
  clearRevealState: motionMocks.clearRevealState,
  createRevealTimeline: motionMocks.createRevealTimeline,
}));

type TimelineMock = ReturnType<typeof createTimelineMock>;

type MotionHarness = {
  parallaxTimelines: TimelineMock[];
  revealTimelines: TimelineMock[];
  revealTriggers: Array<{ kill: ReturnType<typeof vi.fn> }>;
  runnerGroups: TimelineMock[][];
};

type MediaMock = {
  changeBreakpoint: (matches: boolean) => void;
  media: MediaQueryList;
};

// timeline과 연결 ScrollTrigger의 재생·정리 호출을 독립적으로 기록한다.
function createTimelineMock(hasScrollTrigger = false) {
  return {
    fromTo: vi.fn(),
    kill: vi.fn(),
    play: vi.fn(),
    scrollTrigger: hasScrollTrigger ? { kill: vi.fn() } : undefined,
  };
}

// breakpoint listener를 저장하고 desktop과 mobile 전환을 직접 발생시킨다.
function createMediaMock(initialMatches = false): MediaMock {
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  const media = {
    matches: initialMatches,
    addEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        changeListener = listener;
      },
    ),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  // 저장한 동일 listener에 새 matches 값을 전달해 실제 media change를 흉내 낸다.
  const changeBreakpoint = (matches: boolean) => {
    Object.assign(media, { matches });
    changeListener?.({ matches } as MediaQueryListEvent);
  };

  return { changeBreakpoint, media };
}

// 테스트에 필요한 배경 레이어와 desktop·mobile SVG만 최소 DOM으로 만든다.
function createSkillsDom() {
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-parallax-layer="grid"></div>
    <div data-parallax-layer="atmosphere"></div>
    <svg data-skills-bg-svg="desktop"></svg>
    <svg data-skills-bg-svg="mobile"></svg>
  `;

  const desktopSvg = root.querySelector<SVGSVGElement>(
    '[data-skills-bg-svg="desktop"]',
  );
  const mobileSvg = root.querySelector<SVGSVGElement>(
    '[data-skills-bg-svg="mobile"]',
  );

  if (!desktopSvg || !mobileSvg) {
    throw new Error("Skills background fixture is incomplete.");
  }

  return {
    desktopSvg,
    mobileSvg,
    root,
    trigger: document.createElement("section"),
  };
}

// GSAP 하위 모듈이 만든 자원을 세대별로 모아 cleanup 대상을 검증한다.
function createMotionHarness(): MotionHarness {
  const parallaxTimelines: TimelineMock[] = [];
  const revealTimelines: TimelineMock[] = [];
  const revealTriggers: Array<{ kill: ReturnType<typeof vi.fn> }> = [];
  const runnerGroups: TimelineMock[][] = [];
  const gsap = {
    set: vi.fn(),
    timeline: vi.fn(() => {
      const timeline = createTimelineMock(true);
      parallaxTimelines.push(timeline);
      return timeline;
    }),
  };
  const ScrollTrigger = {
    create: vi.fn(() => {
      const trigger = { kill: vi.fn() };
      revealTriggers.push(trigger);
      return trigger;
    }),
  };

  motionMocks.createRunnerTimelines.mockImplementation(() => {
    const timelines = [createTimelineMock(), createTimelineMock()];
    runnerGroups.push(timelines);
    return timelines;
  });
  motionMocks.createRevealTimeline.mockImplementation(() => {
    const timeline = createTimelineMock();
    revealTimelines.push(timeline);
    return timeline;
  });
  motionMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

  return {
    parallaxTimelines,
    revealTimelines,
    revealTriggers,
    runnerGroups,
  };
}

beforeEach(() => {
  document.body.replaceChildren();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initSkillsBackgroundMotion breakpoint lifecycle", () => {
  it("breakpoint 변경 시 기존 모션을 정리하고 mobile SVG로 재구성한다", async () => {
    const { desktopSvg, mobileSvg, root, trigger } = createSkillsDom();
    const mediaMock = createMediaMock();
    const harness = createMotionHarness();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaMock.media));

    const cleanup = await initSkillsBackgroundMotion({
      prefersReducedMotion: false,
      root,
      trigger,
    });

    expect(motionMocks.createRunnerTimelines).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      desktopSvg,
      { paused: true },
    );
    expect(motionMocks.createRevealTimeline).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ activeSvg: desktopSvg }),
    );

    mediaMock.changeBreakpoint(true);

    expect(harness.revealTriggers[0].kill).toHaveBeenCalledOnce();
    expect(harness.revealTimelines[0].kill).toHaveBeenCalledOnce();
    harness.runnerGroups[0].forEach((timeline) => {
      expect(timeline.kill).toHaveBeenCalledOnce();
    });
    expect(harness.parallaxTimelines[0].scrollTrigger?.kill).toHaveBeenCalledOnce();
    expect(harness.parallaxTimelines[0].kill).toHaveBeenCalledOnce();
    expect(motionMocks.createRunnerTimelines).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      mobileSvg,
      { paused: true },
    );
    expect(motionMocks.createRevealTimeline).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ activeSvg: mobileSvg }),
    );

    cleanup();
  });

  it("최종 cleanup은 listener와 현재 자원만 한 번씩 정리한다", async () => {
    const { root, trigger } = createSkillsDom();
    const mediaMock = createMediaMock();
    const harness = createMotionHarness();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaMock.media));

    const cleanup = await initSkillsBackgroundMotion({
      prefersReducedMotion: false,
      root,
      trigger,
    });
    const changeListener = vi.mocked(mediaMock.media.addEventListener).mock.calls[0][1];

    mediaMock.changeBreakpoint(true);
    cleanup();

    expect(mediaMock.media.removeEventListener).toHaveBeenCalledWith(
      "change",
      changeListener,
    );
    harness.revealTriggers.forEach((revealTrigger) => {
      expect(revealTrigger.kill).toHaveBeenCalledOnce();
    });
    harness.revealTimelines.forEach((timeline) => {
      expect(timeline.kill).toHaveBeenCalledOnce();
    });
    harness.runnerGroups.flat().forEach((timeline) => {
      expect(timeline.kill).toHaveBeenCalledOnce();
    });
    harness.parallaxTimelines.forEach((timeline) => {
      expect(timeline.scrollTrigger?.kill).toHaveBeenCalledOnce();
      expect(timeline.kill).toHaveBeenCalledOnce();
    });
  });
});
