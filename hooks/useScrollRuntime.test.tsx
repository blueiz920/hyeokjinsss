import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { startScrollRuntime } from "@/lib/animation/scrollRuntime";
import {
  ScrollRuntimeProvider,
  useScrollRuntime,
} from "./useScrollRuntime";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const runtimeMocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
  loadGsap: vi.fn(),
  lenisCreate: vi.fn(),
  lenisDestroy: vi.fn(),
  lenisOn: vi.fn(),
  lenisRaf: vi.fn(),
  lenisResize: vi.fn(),
  lenisScrollTo: vi.fn(),
  lenisStart: vi.fn(),
  lenisStop: vi.fn(),
}));

vi.mock("./useReducedMotion", () => ({
  useReducedMotion: () => runtimeMocks.prefersReducedMotion,
}));

vi.mock("@/lib/gsap/loadGsap", () => ({
  loadGsap: runtimeMocks.loadGsap,
}));

vi.mock("lenis", () => ({
  default: class LenisMock {
    scroll = 24;

    // 생성 옵션과 인스턴스를 기록해 Provider가 Lenis를 한 번만 소유하는지 검증한다.
    constructor(options: unknown) {
      runtimeMocks.lenisCreate(options, this);
    }

    // Lenis 이벤트 연결을 기록해 ScrollTrigger 갱신 경로를 검증한다.
    on(event: string, callback: () => void) {
      runtimeMocks.lenisOn(event, callback);
    }

    // 프레임 시간이 Lenis에 전달되는지 확인할 수 있도록 호출을 기록한다.
    raf(time: number) {
      runtimeMocks.lenisRaf(time);
    }

    // ScrollTrigger refresh가 Lenis 크기 재계산으로 이어지는지 기록한다.
    resize() {
      runtimeMocks.lenisResize();
    }

    // ScrollTrigger의 스크롤 쓰기가 Lenis로 위임되는지 기록한다.
    scrollTo(value: number, options: unknown) {
      runtimeMocks.lenisScrollTo(value, options);
    }

    start() {
      runtimeMocks.lenisStart();
    }

    stop() {
      runtimeMocks.lenisStop();
    }

    // Provider cleanup에서 Lenis 인스턴스를 정확히 한 번 파기하는지 기록한다.
    destroy() {
      runtimeMocks.lenisDestroy();
    }
  },
}));

const scrollTrigger = {
  addEventListener: vi.fn(),
  defaults: vi.fn(),
  refresh: vi.fn(),
  removeEventListener: vi.fn(),
  scrollerProxy: vi.fn(),
  update: vi.fn(),
};

let mountedRoots: Root[] = [];

// 테스트 렌더에서 Context 값을 읽어 useScrollRuntime의 정상 반환 경로를 실행한다.
const RuntimeProbe = () => {
  const { prefersReducedMotion } = useScrollRuntime();
  return <span>{String(prefersReducedMotion)}</span>;
};

const RuntimeControlProbe = () => {
  const { lockScroll, unlockScroll } = useScrollRuntime();

  return (
    <>
      <button type="button" onClick={lockScroll}>lock</button>
      <button type="button" onClick={unlockScroll}>unlock</button>
    </>
  );
};

beforeAll(() => {
  // React 19가 테스트 환경의 act 호출을 공식 지원하도록 전역 플래그를 활성화한다.
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  // 다른 테스트 파일에 React act 환경 설정이 새지 않도록 전역 플래그를 제거한다.
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

// 외부 resolve 시점을 제어해 GSAP 로딩과 React cleanup 사이의 경합을 재현한다.
const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

// Provider를 실제 React root에 마운트하고 비동기 effect가 정착할 때까지 기다린다.
const mountProvider = async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(
      <ScrollRuntimeProvider>
        <div>content</div>
      </ScrollRuntimeProvider>,
    );
    await Promise.resolve();
  });

  return root;
};

// React root를 언마운트해 Provider의 자원 정리 경로를 실행한다.
const unmountProvider = async (root: Root) => {
  await act(async () => {
    root.unmount();
  });
  mountedRoots = mountedRoots.filter((mountedRoot) => mountedRoot !== root);
};

beforeEach(() => {
  runtimeMocks.prefersReducedMotion = false;
  runtimeMocks.loadGsap.mockResolvedValue({ scrollTrigger, ScrollTrigger: scrollTrigger });
  vi.stubGlobal("requestAnimationFrame", vi.fn().mockReturnValue(41));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  document.documentElement.removeAttribute("data-lenis");
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => {
      root.unmount();
    });
  }
  mountedRoots = [];
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("ScrollRuntimeProvider", () => {
  it("모션이 허용되면 Lenis와 ScrollTrigger를 연결하고 언마운트 시 정리한다", async () => {
    const root = await mountProvider();

    expect(scrollTrigger.defaults).toHaveBeenCalledWith({
      scroller: document.documentElement,
    });
    expect(scrollTrigger.scrollerProxy).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisCreate).toHaveBeenCalledWith(
      {
        lerp: 0.28,
        smoothWheel: true,
        wheelMultiplier: 0.6,
      },
      expect.anything(),
    );
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(scrollTrigger.addEventListener).toHaveBeenCalledWith(
      "refresh",
      expect.any(Function),
    );
    expect(document.documentElement.dataset.lenis).toBe("true");

    const refreshListener = scrollTrigger.addEventListener.mock.calls[0][1];
    await unmountProvider(root);

    expect(cancelAnimationFrame).toHaveBeenCalledWith(41);
    expect(runtimeMocks.lenisDestroy).toHaveBeenCalledOnce();
    expect(scrollTrigger.removeEventListener).toHaveBeenCalledWith(
      "refresh",
      refreshListener,
    );
  });

  it("모션 축소 환경에서는 Lenis와 RAF 없이 네이티브 스크롤 상태를 사용한다", async () => {
    runtimeMocks.prefersReducedMotion = true;
    const root = await mountProvider();
    const proxy = scrollTrigger.scrollerProxy.mock.calls[0][1] as {
      scrollTop: (value?: number) => number;
    };

    proxy.scrollTop(120);

    expect(runtimeMocks.lenisCreate).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120);
    expect(proxy.scrollTop()).toBe(window.scrollY);
    expect(document.documentElement.dataset.lenis).toBe("false");
    expect(scrollTrigger.refresh).toHaveBeenCalledOnce();

    await unmountProvider(root);
    expect(runtimeMocks.lenisDestroy).not.toHaveBeenCalled();
  });

  it("Lenis 이벤트와 스크롤러 프록시를 양방향으로 연결한다", async () => {
    const root = await mountProvider();
    const scrollListener = runtimeMocks.lenisOn.mock.calls[0][1] as () => void;
    const refreshListener = scrollTrigger.addEventListener.mock.calls[0][1] as () => void;
    const proxy = scrollTrigger.scrollerProxy.mock.calls[0][1] as {
      getBoundingClientRect: () => {
        height: number;
        left: number;
        top: number;
        width: number;
      };
      scrollTop: (value?: number) => number;
    };
    const frameCallback = vi.mocked(requestAnimationFrame).mock.calls[0][0];

    scrollListener();
    refreshListener();
    frameCallback(16);
    expect(proxy.scrollTop()).toBe(24);
    proxy.scrollTop(120);

    expect(scrollTrigger.update).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisResize).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisRaf).toHaveBeenCalledWith(16);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(runtimeMocks.lenisScrollTo).toHaveBeenCalledWith(120, {
      immediate: true,
    });
    expect(proxy.getBoundingClientRect()).toEqual({
      height: window.innerHeight,
      left: 0,
      top: 0,
      width: window.innerWidth,
    });

    await unmountProvider(root);
  });

  it("GSAP 로딩 전에 언마운트되면 런타임 자원을 만들지 않는다", async () => {
    const deferred = createDeferred<{ ScrollTrigger: typeof scrollTrigger }>();
    runtimeMocks.loadGsap.mockReturnValue(deferred.promise);
    const root = await mountProvider();

    await unmountProvider(root);
    await act(async () => {
      deferred.resolve({ ScrollTrigger: scrollTrigger });
      await deferred.promise;
    });

    expect(scrollTrigger.defaults).not.toHaveBeenCalled();
    expect(runtimeMocks.lenisCreate).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("제공자 안에서는 현재 모션 정책을 반환한다", () => {
    runtimeMocks.prefersReducedMotion = true;

    const html = renderToString(
      <ScrollRuntimeProvider>
        <RuntimeProbe />
      </ScrollRuntimeProvider>,
    );

    expect(html).toContain("true");
  });

  it("제공자 제어 함수를 활성 런타임에 전달한다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    mountedRoots.push(root);

    await act(async () => {
      root.render(
        <ScrollRuntimeProvider>
          <RuntimeControlProbe />
        </ScrollRuntimeProvider>,
      );
      await Promise.resolve();
    });

    const [lockButton, unlockButton] = container.querySelectorAll("button");
    await act(async () => {
      lockButton.click();
      unlockButton.click();
    });

    expect(runtimeMocks.lenisStop).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisStart).toHaveBeenCalledOnce();
  });

  it("제공자 밖에서 사용하면 명확한 오류를 던진다", () => {
    expect(() => renderToString(<RuntimeProbe />)).toThrow(
      "useScrollRuntime must be used within ScrollRuntimeProvider",
    );
  });
});

describe("startScrollRuntime", () => {
  it("잠금과 잠금 해제를 활성 Lenis 인스턴스에 전달한다", async () => {
    const runtime = startScrollRuntime({ prefersReducedMotion: false });
    await act(async () => {
      await Promise.resolve();
    });

    runtime.lockScroll();
    runtime.unlockScroll();

    expect(runtimeMocks.lenisStop).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisStart).toHaveBeenCalledOnce();
    runtime.dispose();
  });

  it("초기 잠금 상태로 생성하면 Lenis를 멈춘 채 시작한다", async () => {
    const runtime = startScrollRuntime({
      initiallyLocked: true,
      prefersReducedMotion: false,
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(runtimeMocks.lenisStop).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisStart).not.toHaveBeenCalled();

    runtime.unlockScroll();

    expect(runtimeMocks.lenisStart).toHaveBeenCalledOnce();
    runtime.dispose();
  });

  it("정리 함수를 여러 번 호출해도 런타임 자원을 한 번만 정리한다", async () => {
    const runtime = startScrollRuntime({ prefersReducedMotion: false });
    await act(async () => {
      await Promise.resolve();
    });

    runtime.dispose();
    runtime.dispose();

    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(runtimeMocks.lenisDestroy).toHaveBeenCalledOnce();
    expect(scrollTrigger.removeEventListener).toHaveBeenCalledOnce();
  });

  it("GSAP 로딩이 실패하면 오류를 남기고 네이티브 스크롤을 유지한다", async () => {
    const loadError = new Error("chunk load failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    runtimeMocks.loadGsap.mockRejectedValue(loadError);

    const runtime = startScrollRuntime({ prefersReducedMotion: false });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.documentElement.dataset.lenis).toBe("false");
    expect(runtimeMocks.lenisCreate).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("native scrolling"),
      loadError,
    );

    runtime.dispose();
  });
});
