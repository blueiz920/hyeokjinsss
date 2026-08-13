import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSkillsIntro } from "@/lib/animation/skillsIntro";
import {
  SECTION_INTENT_EVENT,
  type SectionIntentDetail,
} from "@/lib/navigation/sectionIntent";

const introMocks = vi.hoisted(() => ({
  Flip: {
    from: vi.fn(),
    getState: vi.fn(),
  },
  loadGsap: vi.fn(),
  lockScroll: vi.fn(),
  unlockScroll: vi.fn(),
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
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
    bottom: 900,
    height: 800,
    left: 0,
    right: 1440,
    top: 100,
    width: 1440,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  });
  root.innerHTML = `
    <p class="skills-expertise-eyebrow"></p>
    <h2 class="skills-expertise-title">
      <span data-skill-title-line><span data-skill-title-char>문</span></span>
      <span data-skill-title-line><span data-skill-title-char>방</span></span>
    </h2>
    <p class="skills-expertise-description"></p>
    <div class="skills-expertise-visual-inner">
      <div class="skills-expertise-stage">
        <div class="skills-expertise-photo"><img alt="" /></div>
      </div>
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
    set: vi.fn(),
    to: vi.fn(),
  };
  Object.values(timeline).forEach((method) => method.mockReturnValue(timeline));
  const triggers = Array.from({ length: 2 }, () => ({ kill: vi.fn() }));
  const triggerOptions: Array<Record<string, unknown>> = [];
  const gsap = {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => timeline),
  };
  const ScrollTrigger = {
    create: vi.fn((options: Record<string, unknown>) => {
      triggerOptions.push(options);
      return triggers[triggerOptions.length - 1];
    }),
    refresh: vi.fn(),
  };
  introMocks.loadGsap.mockResolvedValue({ gsap, ScrollTrigger });

  return { gsap, ScrollTrigger, timeline, triggerOptions, triggers };
}

beforeEach(() => {
  introMocks.Flip.from.mockReset();
  introMocks.Flip.from.mockReturnValue({ kill: vi.fn() });
  introMocks.Flip.getState.mockReset();
  introMocks.Flip.getState.mockReturnValue({ state: true });
  introMocks.lockScroll.mockReset();
  introMocks.unlockScroll.mockReset();
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  delete document.documentElement.dataset.sectionTarget;
  delete document.documentElement.dataset.skillsLocked;
  delete document.documentElement.dataset.skillsIntroPlayed;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("initSkillsIntro", () => {
  it("데스크톱에서 시간 기반 글자·사진·최종 배치 타임라인을 연결한다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root,
      unlockScroll: introMocks.unlockScroll,
    });

    expect(root.dataset.skillEntry).toBeUndefined();
    expect(harness.triggerOptions).toEqual([
      expect.objectContaining({ start: "top 92%" }),
      expect.objectContaining({ start: "top top" }),
    ]);

    const armOptions = harness.triggerOptions[0] as {
      onEnter: () => void;
    };
    armOptions.onEnter();
    expect(root.dataset.skillEntry).toBe("armed");
    expect(harness.gsap.set).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        autoAlpha: 0,
        clipPath: "inset(100% 0% 0% 0%)",
      }),
    );

    const entryOptions = harness.triggerOptions[1] as {
      onEnter: () => void;
    };
    entryOptions.onEnter();
    expect(root.dataset.skillEntry).toBe("staged");
    expect(document.documentElement.dataset.skillsLocked).toBe("true");
    expect(introMocks.lockScroll).toHaveBeenCalledOnce();
    expect(harness.timeline.play).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.skillsIntroPlayed).toBe("true");
    const visual = root.querySelector(".skills-expertise-stage");
    const visualStage = harness.gsap.set.mock.calls.find(
      ([target, options]) =>
        target === visual && options.position === "fixed",
    )?.[1] as { height: number; width: number };
    expect(visualStage.width / visualStage.height).toBeCloseTo(
      (root.clientWidth / 2) / window.innerHeight,
    );
    expect(harness.timeline.to).toHaveBeenCalledTimes(9);
    expect(harness.timeline.to.mock.calls[0]).toEqual([
      expect.any(Array),
      expect.objectContaining({ duration: 0.7, stagger: 0.03 }),
      0.2,
    ]);
    expect(harness.timeline.to.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ duration: 0.75 }),
    );
    const visualTween = harness.timeline.to.mock.calls.find(
      ([target, options, position]) =>
        target === visual && options.left === 0 && position === "layout",
    )?.[1] as {
      height: () => number;
      width: () => number;
      xPercent: number;
      yPercent: number;
    };
    expect(visualTween.height()).toBe(window.innerHeight);
    expect(visualTween.width()).toBe(root.clientWidth / 2);
    expect(visualTween).toEqual(
      expect.objectContaining({ xPercent: 0, yPercent: 0 }),
    );
    expect(harness.timeline.set).toHaveBeenCalledWith(
      visual,
      { zIndex: 3 },
      "layout",
    );
    expect(harness.timeline.call.mock.calls[1]?.[2]).toBe("layout+=1");

    const layoutCall = harness.timeline.call.mock.calls[0]?.[0] as () => void;
    layoutCall();
    expect(root.dataset.skillEntry).toBe("complete");
    expect(harness.gsap.set).toHaveBeenCalledWith(
      [
        root.querySelector(".skills-expertise-title"),
        ...root.querySelectorAll("[data-skill-title-line]"),
      ],
      expect.objectContaining({
        clearProps: expect.not.stringContaining("zIndex"),
      }),
    );
    expect(introMocks.Flip.getState).toHaveBeenCalledWith([
      root.querySelector(".skills-expertise-title"),
      ...root.querySelectorAll("[data-skill-title-line]"),
    ]);
    expect(introMocks.Flip.from).toHaveBeenCalledWith(
      { state: true },
      expect.objectContaining({
        absolute: false,
        duration: 1,
        ease: "power3.inOut",
      }),
    );

    const finishCall = harness.timeline.call.mock.calls[1]?.[0] as () => void;
    finishCall();
    expect(root.dataset.skillPanelReady).toBe("true");
    expect(document.documentElement.dataset.skillsLocked).toBeUndefined();
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(harness.gsap.set).toHaveBeenCalledWith(
      root.querySelector(".skills-expertise-title"),
      { clearProps: "zIndex" },
    );

    media.setMatches(false);
    expect(root.dataset.skillEntry).toBeUndefined();
    expect(root.dataset.skillPanelReady).toBeUndefined();
    harness.triggers.forEach((trigger) => {
      expect(trigger.kill).toHaveBeenCalledOnce();
    });

    cleanup();
  });

  it("모션 축소 환경과 필수 DOM 누락에서는 정적 상태를 유지한다", async () => {
    const reducedCleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: true,
      root: createIntroDom(),
      unlockScroll: introMocks.unlockScroll,
    });
    const staticRoot = document.createElement("section");
    const staticCleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root: staticRoot,
      unlockScroll: introMocks.unlockScroll,
    });

    expect(introMocks.loadGsap).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.skillsIntroPlayed).toBe("true");
    expect(staticRoot.dataset.skillPanelReady).toBe("true");
    expect(() => reducedCleanup()).not.toThrow();
    expect(() => staticCleanup()).not.toThrow();
    expect(staticRoot.dataset.skillPanelReady).toBeUndefined();
  });

  it("같은 문서에서 다시 마운트되면 인트로 트리거를 재생성하지 않는다", async () => {
    const firstRoot = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const firstCleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root: firstRoot,
      unlockScroll: introMocks.unlockScroll,
    });
    (harness.triggerOptions[0] as { onEnter: () => void }).onEnter();
    (harness.triggerOptions[1] as { onEnter: () => void }).onEnter();
    expect(document.documentElement.dataset.skillsIntroPlayed).toBe("true");

    firstCleanup();
    const loadCount = introMocks.loadGsap.mock.calls.length;
    const secondRoot = createIntroDom();
    const secondCleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root: secondRoot,
      unlockScroll: introMocks.unlockScroll,
    });

    expect(secondRoot.dataset.skillPanelReady).toBe("true");
    expect(secondRoot.dataset.skillEntry).toBeUndefined();
    expect(introMocks.loadGsap).toHaveBeenCalledTimes(loadCount);
    expect(introMocks.lockScroll).toHaveBeenCalledOnce();
    expect(harness.timeline.play).toHaveBeenCalledOnce();

    secondCleanup();
    expect(secondRoot.dataset.skillPanelReady).toBeUndefined();
  });

  it("복원된 스크롤이 이미 섹션을 지난 경우 정적 완료 상태로 고정한다", async () => {
    const root = createIntroDom();
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 1440,
      top: -120,
      width: 1440,
      x: 0,
      y: -120,
      toJSON: () => ({}),
    });
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root,
      unlockScroll: introMocks.unlockScroll,
    });

    expect(document.documentElement.dataset.skillsIntroPlayed).toBe("true");
    expect(root.dataset.skillPanelReady).toBe("true");
    expect(harness.ScrollTrigger.create).not.toHaveBeenCalled();
    expect(harness.gsap.timeline).not.toHaveBeenCalled();
    expect(introMocks.lockScroll).not.toHaveBeenCalled();

    cleanup();
  });

  it("다른 섹션 목적지로 통과할 때 장면과 잠금을 시작하지 않는다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));
    document.documentElement.dataset.sectionTarget = "contact";

    const cleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root,
      unlockScroll: introMocks.unlockScroll,
    });

    const armOptions = harness.triggerOptions[0] as {
      onEnter: () => void;
    };
    const entryOptions = harness.triggerOptions[1] as {
      onEnter: () => void;
    };
    armOptions.onEnter();
    entryOptions.onEnter();

    expect(root.dataset.skillEntry).toBeUndefined();
    expect(document.documentElement.dataset.skillsLocked).toBeUndefined();
    expect(harness.gsap.timeline).not.toHaveBeenCalled();
    expect(harness.timeline.play).not.toHaveBeenCalled();

    cleanup();
  });

  it("재생 중 다른 섹션으로 이동하면 잠금과 장면만 숨기고 타임라인은 유지한다", async () => {
    const root = createIntroDom();
    const media = createMedia();
    const harness = createHarness();
    vi.stubGlobal("matchMedia", vi.fn(() => media.media));

    const cleanup = await initSkillsIntro({
      lockScroll: introMocks.lockScroll,
      prefersReducedMotion: false,
      root,
      unlockScroll: introMocks.unlockScroll,
    });
    (harness.triggerOptions[0] as { onEnter: () => void }).onEnter();
    (harness.triggerOptions[1] as { onEnter: () => void }).onEnter();

    const detail: SectionIntentDetail = { id: "contact", phase: "start" };
    document.dispatchEvent(
      new CustomEvent<SectionIntentDetail>(SECTION_INTENT_EVENT, { detail }),
    );

    expect(document.documentElement.dataset.skillsLocked).toBeUndefined();
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
    expect(root.dataset.skillEntryMuted).toBe("true");
    expect(harness.timeline.kill).not.toHaveBeenCalled();
    expect(harness.timeline.progress).not.toHaveBeenCalled();

    cleanup();
    expect(introMocks.unlockScroll).toHaveBeenCalledOnce();
  });
});
