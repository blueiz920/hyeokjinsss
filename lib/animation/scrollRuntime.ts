import Lenis from "lenis";
import { loadGsap } from "@/lib/gsap/loadGsap";

type ScrollRuntimeOptions = {
  prefersReducedMotion: boolean;
};

type ScrollRuntime = {
  dispose: () => void;
  lockScroll: () => void;
  unlockScroll: () => void;
};

type LenisInstance = InstanceType<typeof Lenis>;

// Lenis와 ScrollTrigger의 생성·연결·정리를 한 생명주기로 묶어 시작한다.
// React 밖에서도 즉시 dispose할 수 있어 비동기 로딩 경합을 안전하게 처리한다.
export const startScrollRuntime = ({
  prefersReducedMotion,
}: ScrollRuntimeOptions): ScrollRuntime => {
  let disposed = false;
  let lenis: LenisInstance | null = null;
  let rafId: number | null = null;
  let removeRefreshListener: (() => void) | null = null;
  let isLocked = false;

  const lockScroll = () => {
    isLocked = true;
    lenis?.stop();
  };

  const unlockScroll = () => {
    isLocked = false;
    lenis?.start();
  };

  // Lenis를 사용할 수 없는 경로에서 문서 상태를 네이티브 스크롤로 명시한다.
  const enableNativeScroll = () => {
    document.documentElement.dataset.lenis = "false";
  };

  // 현재 runtime이 소유한 listener, RAF, Lenis를 역순으로 정리한다.
  const clearRuntime = () => {
    removeRefreshListener?.();
    removeRefreshListener = null;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    lenis?.destroy();
    lenis = null;
  };

  // GSAP 로딩 뒤 문서 scroller를 설정하고 모션 정책에 맞는 runtime을 구성한다.
  const setupRuntime = async () => {
    const { ScrollTrigger } = await loadGsap();
    if (disposed) return;

    const scroller = document.documentElement;
    const shouldUseLenis = !prefersReducedMotion;
    ScrollTrigger.defaults({ scroller });

    ScrollTrigger.scrollerProxy(scroller, {
      // ScrollTrigger의 읽기·쓰기 요청을 활성 Lenis 또는 네이티브 스크롤로 연결한다.
      scrollTop(value) {
        if (typeof value === "number") {
          if (shouldUseLenis && lenis) {
            lenis.scrollTo(value, { immediate: true });
          } else {
            window.scrollTo(0, value);
          }
        }

        return shouldUseLenis && lenis ? lenis.scroll : window.scrollY;
      },
      // ScrollTrigger가 문서 viewport를 고정된 scroller 영역으로 계산하도록 크기를 제공한다.
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: "fixed",
    });

    if (!shouldUseLenis) {
      enableNativeScroll();
      ScrollTrigger.refresh();
      return;
    }

    lenis = new Lenis({
      lerp: 0.28,
      wheelMultiplier: 0.6,
      smoothWheel: true,
    });
    if (isLocked) lenis.stop();

    // Lenis의 스크롤 변화를 ScrollTrigger 계산에 즉시 반영한다.
    const syncScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", syncScroll);

    // 브라우저 프레임 시간을 Lenis에 전달하고 dispose 전까지 다음 프레임을 예약한다.
    const updateFrame = (time: number) => {
      if (disposed || !lenis) return;

      lenis.raf(time);
      rafId = requestAnimationFrame(updateFrame);
    };
    rafId = requestAnimationFrame(updateFrame);

    // ScrollTrigger refresh 시 Lenis도 최신 문서 높이를 다시 계산한다.
    const resizeLenis = () => {
      lenis?.resize();
    };
    ScrollTrigger.addEventListener("refresh", resizeLenis);

    // 등록 때 사용한 동일한 함수 참조로 refresh listener를 해제한다.
    removeRefreshListener = () => {
      ScrollTrigger.removeEventListener("refresh", resizeLenis);
    };

    document.documentElement.dataset.lenis = "true";
    ScrollTrigger.refresh();
  };

  // 비동기 초기화 실패를 runtime 내부에서 끝내고 네이티브 스크롤을 유지한다.
  const setupSafely = async () => {
    try {
      await setupRuntime();
    } catch (error) {
      if (disposed) return;

      clearRuntime();
      enableNativeScroll();
      console.error(
        "Scroll runtime initialization failed; using native scrolling.",
        error,
      );
    }
  };

  // 여러 번 호출되어도 처음 한 번만 runtime 자원을 폐기한다.
  const disposeRuntime = () => {
    if (disposed) return;

    disposed = true;
    clearRuntime();
  };

  void setupSafely();

  return { dispose: disposeRuntime, lockScroll, unlockScroll };
};
