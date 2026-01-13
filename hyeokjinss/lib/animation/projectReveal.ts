import { loadGsap } from "@/lib/gsap/loadGsap";
import { motionDefaults } from "./runtime";
import { getMotionProfile } from "@/lib/motion/mediaPolicy";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

type ProjectRevealOptions = {
  root: HTMLElement;
  pinFrame: HTMLElement;
  stage: HTMLElement;
  cards: HTMLElement[];
  bgLayer?: HTMLElement | null;
  prefersReducedMotion: boolean;
  onActiveChange?: (active: boolean) => void;
  onStepChange?: (step: number) => void;
};

export const initProjectReveal = async ({
  root,
  pinFrame,
  stage,
  cards,
  bgLayer,
  prefersReducedMotion,
  onActiveChange,
  onStepChange,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const profile = getMotionProfile(prefersReducedMotion);

  const distance = prefersReducedMotion ? 12 : 26; // 섹션 등장용
  const cardDistance = prefersReducedMotion ? 18 : 36; // 카드 전환용

  // step 정의 (0..maxStep)
  const maxStep = Math.max(0, cards.length - 1);
  // pin 구간 길이는 최소 1 step은 확보(카드 1장이어도 pin 안정)
  const endSteps = Math.max(1, maxStep);

  const getFrameH = () => Math.max(1, pinFrame.getBoundingClientRect().height);
  const getEnd = () => `+=${getFrameH() * endSteps}`;

  /**
   * 0) 최초 상태 세팅
   * - 카드 스택(겹침) 유지
   */
  gsap.set(cards, { autoAlpha: 0, y: cardDistance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  // 1) 섹션 "등장" 애니메이션 (pin 시작 전 1회)
  const headingTargets = pinFrame.querySelectorAll<HTMLElement>("p, h2");
  const enterTl = gsap.timeline({ paused: true });

  enterTl.fromTo(
    pinFrame,
    { autoAlpha: 0, y: distance },
    {
      autoAlpha: 1,
      y: 0,
      duration: prefersReducedMotion ? 0.55 : 2.55,
      ease: motionDefaults.ease,
      clearProps: "transform",
    },
    0,
  );

  if (headingTargets.length) {
    enterTl.fromTo(
      headingTargets,
      { autoAlpha: 0, y: prefersReducedMotion ? 6 : 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.2 : 1.45,
        ease: motionDefaults.ease,
        stagger: prefersReducedMotion ? 0.02 : 0.06,
        clearProps: "transform",
      },
      prefersReducedMotion ? 0 : 0.06,
    );
  }

  enterTl.fromTo(
    cards[0],
    { y: prefersReducedMotion ? 10 : 18, autoAlpha: 1 },
    {
      y: 0,
      duration: prefersReducedMotion ? 0.25 : 1.55,
      ease: motionDefaults.ease,
      clearProps: "transform",
    },
    0.08,
  );

  if (bgLayer) {
    enterTl.fromTo(
      bgLayer,
      { autoAlpha: 0, y: 0 },
      {
        autoAlpha: 1,
        duration: prefersReducedMotion ? 0.2 : 0.45,
        ease: "none",
      },
      0,
    );
  }

  const enterTrigger = ScrollTrigger.create({
    trigger: pinFrame,
    start: "top 85%",
    once: true,
    onEnter: () => enterTl.play(0),
  });

  /**
   * 2) pin + 카드 전환 타임라인
   * - 라벨(card{i})은 "전환 끝(정착)"
   * - 전환이 시작되면 즉시 해당 step으로 확정 + HOLD
   * - HOLD 동안 wheel/touchmove 입력 자체 차단(관성/연타 포함)
   */

  const TRANS = prefersReducedMotion ? 0.45 : 0.78; // 카드 전환 길이(클수록 느림)
  const HOLD_MS = prefersReducedMotion ? 160 : 700; // 전환 후 다음 전환 금지 시간
  const HOLD_CAP = prefersReducedMotion ? 0.04 : 0.06; // HOLD 중 허용 상한(정착 라벨 이후 조금)
  const START_EPS = prefersReducedMotion ? 0.03 : 0.02; // 전환 시작 감지 여유

  // projects active는 pin 타임라인과 분리해서 안정적으로 판단 (앞/뒤 여유)
  const ACTIVE_START = "top 30%";
  const ACTIVE_END = "bottom 50%";

  let committedStep = 0; // HOLD/캡 기준이 되는 확정 step
  let holdUntil = 0;
  let gateLock = false;

  // step emit은 "파생(derive) + 변경 시 emit"으로 누락 방지
  let emittedStep = -1;
  const emitStep = (step: number) => {
    const next = Math.max(0, Math.min(step, maxStep));
    if (next === emittedStep) return;
    emittedStep = next;
    onStepChange?.(next);
  };

  const deriveStep = (t: number) => {
    // 전환 시작 시점(i - TRANS)을 넘으면 i로 간주 (체감상 "카드 넘어감"과 일치)
    for (let i = maxStep; i >= 1; i--) {
      if (t >= i - TRANS + START_EPS) return i;
    }
    return 0;
  };

  function scrollToTime(self: ScrollTriggerType, time: number, timeline: gsap.core.Timeline) {
    const dur = Math.max(0.0001, timeline.duration());
    const p = Math.max(0, Math.min(1, time / dur));
    const y = self.start + (self.end - self.start) * p;

    gateLock = true;
    self.scroll(y);

    // setTimeout 대신 rAF로 풀어서 "빈틈" 최소화
    requestAnimationFrame(() => {
      gateLock = false;
    });
  }

  const tl = gsap.timeline({
    defaults: { ease: motionDefaults.ease, duration: TRANS },
    scrollTrigger: {
      trigger: pinFrame,
      start: "top top",
      end: getEnd,
      scrub: prefersReducedMotion ? 0.2 : 0.22,
      pin: pinFrame,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      snap: prefersReducedMotion
        ? { snapTo: "labelsDirectional", duration: 0.22, delay: 0, inertia: false }
        : { snapTo: "labelsDirectional", duration: 0.17, delay: 0.02, inertia: false },

      onUpdate: (self: ScrollTriggerType) => {
        const t = tl.time();

        // ✅ dots는 gateLock 여부와 무관하게 항상 최신 step으로 동기화
        emitStep(deriveStep(t));

        // 아래 로직은 스크롤 강제 이동 중엔 건드리지 않음
        if (gateLock) return;

        const now = performance.now();

        // ✅ HOLD 중: 다음 전환 시작으로 못 가게 상한으로 막기
        if (now < holdUntil) {
          const capTime = Math.min(tl.duration(), committedStep + HOLD_CAP);
          if (t > capTime) scrollToTime(self, capTime, tl);
          return;
        }

        // ✅ 앞으로 전환 시작 감지 → step 확정 + HOLD 시작 + 정착점으로 강제 정렬
        if (committedStep < maxStep) {
          const next = committedStep + 1;
          const nextStart = next - TRANS;

          if (t >= nextStart + START_EPS) {
            committedStep = next;
            holdUntil = now + HOLD_MS;

            // step은 emitStep이 tl.time 기반으로 이미 따라오지만,
            // 강제 정렬 직후 한 번 더 확정해도 무해 (안전)
            emitStep(committedStep);

            scrollToTime(self, committedStep, tl);
          }
        }
      },
    },
  });

  // 라벨은 "정착점"
  tl.addLabel("card0", 0);

  // 전환은 라벨(i)보다 TRANS만큼 앞에서 시작해서, 라벨(i)에서 끝나게 배치
  for (let i = 1; i < cards.length; i++) {
    tl.addLabel(`card${i}`, i);

    const prev = cards[i - 1];
    const cur = cards[i];

    const startAt = i - TRANS;

    tl.to(prev, { autoAlpha: 0, y: -cardDistance }, startAt).fromTo(
      cur,
      { autoAlpha: 0, y: cardDistance },
      { autoAlpha: 1, y: 0 },
      startAt,
    );
  }

  // ✅ projects active 전용 트리거 (pin 타임라인과 분리)
  const indicatorTrigger = ScrollTrigger.create({
    trigger: root,
    start: ACTIVE_START,
    end: ACTIVE_END,
    onEnter: () => {
      onActiveChange?.(true);
      emitStep(deriveStep(tl.time()));
    },
    onEnterBack: () => {
      onActiveChange?.(true);
      emitStep(deriveStep(tl.time()));
    },
    onLeave: () => onActiveChange?.(false),
    onLeaveBack: () => onActiveChange?.(false),
  });

  // 초기 step 동기화(첫 렌더)
  emitStep(0);

  // ✅ HOLD 동안 입력 자체 차단(트랙패드 관성/연타 포함)
  const inputBlockOptions = { passive: false, capture: true } as const;

  const blockInputDuringHold = (e: WheelEvent | TouchEvent) => {
    const st = tl.scrollTrigger;
    if (!st) return;

    // pin 구간에서만 + HOLD 시간 동안만 차단
    if (performance.now() < holdUntil && st.isActive) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
  };

  window.addEventListener("wheel", blockInputDuringHold, inputBlockOptions);
  window.addEventListener("touchmove", blockInputDuringHold, inputBlockOptions);

  // 3) 배경 패럴랙스(핀 구간에서만)
  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      y: -profile.drift,
      ease: "none",
      scrollTrigger: {
        trigger: pinFrame,
        start: "top top",
        end: getEnd,
        scrub: profile.scrub,
        invalidateOnRefresh: true,
      },
    });
  }

  const handleRefresh = () => {
    gsap.set(stage, { height: "100%" });
  };

  ScrollTrigger.addEventListener("refreshInit", handleRefresh);
  handleRefresh();

  requestAnimationFrame(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 250);

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", handleRefresh);

    window.removeEventListener("wheel", blockInputDuringHold, inputBlockOptions);
    window.removeEventListener("touchmove", blockInputDuringHold, inputBlockOptions);

    indicatorTrigger.kill();

    enterTrigger.kill();
    enterTl.kill();

    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();

    tl.scrollTrigger?.kill();
    tl.kill();

    // 상태는 마지막에 정리(SSOT consumer가 안전하게 종료 처리 가능)
    onActiveChange?.(false);
  };
};
