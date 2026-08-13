import { afterEach, describe, expect, it, vi } from "vitest";
import { initIntroLoader } from "./introLoader";

const loaderMocks = vi.hoisted(() => ({
  loadGsap: vi.fn(),
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: loaderMocks.loadGsap,
}));

const createLoader = () => {
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-loader-screen>
      <div data-loader-words><p data-loader-word>첫 문구</p></div>
      <div data-loader-curve></div>
    </div>
  `;
  return root;
};

const createHarness = () => {
  const timeline = {
    call: vi.fn(),
    kill: vi.fn(),
    to: vi.fn(),
  };
  timeline.call.mockReturnValue(timeline);
  timeline.to.mockReturnValue(timeline);
  const gsap = {
    set: vi.fn(),
    timeline: vi.fn(() => timeline),
  };
  loaderMocks.loadGsap.mockResolvedValue({ gsap });
  return { gsap, timeline };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("initIntroLoader", () => {
  it("로더 퇴장 시작과 동시에 인트로 드러내기를 예약한다", async () => {
    const { gsap, timeline } = createHarness();
    const onReveal = vi.fn();
    const onComplete = vi.fn();

    const cleanup = await initIntroLoader({
      root: createLoader(),
      onReveal,
      onComplete,
    });

    expect(gsap.timeline).toHaveBeenCalledWith({ onComplete });
    expect(timeline.call).toHaveBeenCalledWith(onReveal, [], 1.52);

    cleanup();
    expect(timeline.kill).toHaveBeenCalledOnce();
  });

  it("로더 DOM이 불완전해도 인트로와 로더를 모두 완료한다", async () => {
    createHarness();
    const onReveal = vi.fn();
    const onComplete = vi.fn();

    await initIntroLoader({
      root: document.createElement("div"),
      onReveal,
      onComplete,
    });

    expect(onReveal).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
