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
};

export const initProjectReveal = async ({
  root,
  pinFrame,
  stage,
  cards,
  bgLayer,
  prefersReducedMotion,
}: ProjectRevealOptions) => {
  const { gsap, ScrollTrigger } = await loadGsap();
  if (!cards.length) return () => {};

  const profile = getMotionProfile(prefersReducedMotion);
  const distance = prefersReducedMotion ? 12 : 26; // 등장용(살짝만)
  const cardDistance = prefersReducedMotion ? 18 : 36; // 카드 전환용(기존)
  const steps = Math.max(1, cards.length - 1);
  const getFrameH = () => Math.max(1, pinFrame.getBoundingClientRect().height);
  const getEnd = () => `+=${getFrameH() * steps}`;

  /**
   * 0) 최초 상태 세팅
   * - 카드 스택(겹침) 유지
   * - pin 시작 전에도 "보이되, 살짝 들어오는" 연출을 위해 pinFrame / 타이틀 / bg를 별도로 등장 처리
   */
  gsap.set(cards, { autoAlpha: 0, y: cardDistance });
  gsap.set(cards[0], { autoAlpha: 1, y: 0 });

  // 섹션 타이틀/설명 같은 것들(프로젝트 구조가 유지되도록 data 속성 없이 안전 셀렉터로)
  const header = root.querySelector<HTMLElement>('[aria-labelledby="projects-title"]');
  // 위 셀렉터가 넓으면, 더 보수적으로 pinFrame 안의 Container만 잡기:
  const headingTargets =
    pinFrame.querySelectorAll<HTMLElement>("p, h2");

  // 1) ✅ “등장” 애니메이션 (pin 시작 전 1회)
  // - pinFrame 전체가 뷰포트에 들어올 때: 타이틀/첫 카드/배경이 스르륵 등장
  const enterTl = gsap.timeline({ paused: true });

  // pinFrame 자체(전체 덩어리) 살짝 업 + 페이드
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

  // 헤더 텍스트는 약간의 딜레이로
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

  // 첫 카드(이미 보이게 세팅되어 있으니, transform만 살짝)
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

  // 배경은 더 약하게
  if (bgLayer) {
    enterTl.fromTo(
      bgLayer,
      { autoAlpha: 0, y: 0 },
      {
        autoAlpha: 1,
        duration: prefersReducedMotion ? 0.2 : 0.45,
        ease: "none",
        // bgLayer는 pin 스크럽에서 transform을 쓰므로 clearProps 금지
      },
      0,
    );
  }

  const enterTrigger = ScrollTrigger.create({
    trigger: pinFrame,
    start: "top 85%", // 화면 아래에서 들어올 때
    once: true,
    onEnter: () => {
      enterTl.play(0);
    },
  });

  // 2) ✅ pin + 카드 전환 타임라인
// 핵심: "card{i} 라벨은 전환 끝(정착)" / 전환이 시작되면 즉시 HOLD
const TRANS = prefersReducedMotion ? 0.45 : 0.78; // 전환 길이(1보다 작게/크게 조절 가능, 1 미만이면 정착 구간이 생김)
const HOLD_MS = prefersReducedMotion ? 160 : 900; // 카드 넘어간 직후 다음 전환 금지 시간
const HOLD_CAP = prefersReducedMotion ? 0.04 : 0.06; // HOLD 중 허용 상한(정착 라벨 이후 조금은 허용)
const START_EPS = prefersReducedMotion ? 0.03 : 0.02; // 전환 시작 감지 여유

let currentStep = 0;
let holdUntil = 0;
let gateLock = false;

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

    // ✅ 라벨 스냅 유지 (단, 라벨이 "정착점"이 되도록 아래 루프에서 타임 배치 바꿈)
    snap: prefersReducedMotion
      ? { snapTo: "labelsDirectional", duration: 0.32, delay: 0, inertia: false }
      : { snapTo: "labelsDirectional", duration: 0.17, delay: 0.02, inertia: false },

    onUpdate: (self) => {
      if (gateLock) return;

      const now = performance.now();
      const t = tl.time();

      // ✅ HOLD 중: 다음 전환 시작으로 못 가게 "상한"으로 막기 (속도/스냅 여부 무관)
      if (now < holdUntil) {
        // currentStep 정착 라벨(time = currentStep)보다 조금만 더 허용
        const capTime = Math.min(tl.duration(), currentStep + HOLD_CAP);

        if (t > capTime) {
          scrollToTime(self, capTime);
        }
        return;
      }

      // ✅ 앞으로(다음 카드) 전환 "시작" 감지
      // 전환 to step (currentStep+1)은 (currentStep+1 - TRANS)에서 시작해서 (currentStep+1)에서 끝남
      if (currentStep < steps) {
        const next = currentStep + 1;
        const nextStart = next - TRANS;

        // 전환이 시작됐다고 판단되면: 즉시 다음 스텝으로 확정 + HOLD 시작 + 정착점으로 붙이기
        if (t >= nextStart + START_EPS) {
          currentStep = next;
          holdUntil = now + HOLD_MS;

          // ✅ "전환 끝(정착)" 라벨로 붙여서, 이전 카드가 다 사라진 상태로 고정되게
          scrollToTime(self, currentStep);
          return;
        }
      }

      // (선택) 뒤로(이전 카드)도 깔끔히 정착시키고 싶으면 아래를 살려도 됨
      // - 너가 요구한 건 forward HOLD라서 기본은 주석 처리해둠
      /*
      if (currentStep > 0) {
        const prev = currentStep - 1;
        const curStart = currentStep - TRANS; // currentStep으로 들어오는 전환 시작점
        if (t <= curStart - START_EPS) {
          currentStep = prev;
          scrollToTime(self, currentStep);
          return;
        }
      }
      */
    },
  },
});

// time(타임라인 시간) -> 스크롤 위치로 강제 이동
const scrollToTime = (self: ScrollTriggerType, time: number) => {
  const dur = Math.max(0.0001, tl.duration());
  const p = Math.max(0, Math.min(1, time / dur));
  const y = self.start + (self.end - self.start) * p;

  gateLock = true;
  self.scroll(y);
  window.setTimeout(() => {
    gateLock = false;
  }, prefersReducedMotion ? 70 : 110);
};

// ✅ 라벨은 "정착점"
tl.addLabel("card0", 0);

// ✅ 전환은 라벨(i)보다 TRANS만큼 앞에서 시작해서, 라벨(i)에서 끝나게 배치
for (let i = 1; i < cards.length; i++) {
  tl.addLabel(`card${i}`, i);

  const prev = cards[i - 1];
  const cur = cards[i];

  const startAt = i - TRANS; // 전환 시작 시점 (정착 라벨보다 앞)

  tl.to(prev, { autoAlpha: 0, y: -cardDistance }, startAt).fromTo(
    cur,
    { autoAlpha: 0, y: cardDistance },
    { autoAlpha: 1, y: 0 },
    startAt,
  );
}


  // 3) ✅ 배경 패럴랙스(핀 구간에서만)
  let bgTween: gsap.core.Tween | null = null;
  if (bgLayer) {
    bgTween = gsap.to(bgLayer, {
      y: -profile.drift,
      // opacity: 0.10,
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

    enterTrigger.kill();
    enterTl.kill();

    bgTween?.scrollTrigger?.kill();
    bgTween?.kill();

    tl.scrollTrigger?.kill();
    tl.kill();
  };
};
