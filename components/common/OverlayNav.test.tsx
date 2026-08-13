import { act, useCallback, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
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
import { OverlayNav } from "./OverlayNav";

const navMocks = vi.hoisted(() => ({
  scrollTo: vi.fn(),
}));

vi.mock("@/hooks/useSectionRegistry", () => ({
  useSectionRegistry: () => ({ scrollTo: navMocks.scrollTo }),
}));

const navItems = [
  { id: "intro", label: "Intro" },
  { id: "projects", label: "Projects" },
];

let mountedRoots: Root[] = [];

const OverlayHarness = () => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" data-opener onClick={openMenu}>
        메뉴 열기
      </button>
      <button type="button" data-trigger ref={triggerRef} onClick={closeMenu}>
        메뉴 닫기
      </button>
      <OverlayNav
        open={open}
        onClose={closeMenu}
        navItems={navItems}
        socialItems={[]}
        triggerRef={triggerRef}
      />
    </>
  );
};

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

const mountOverlay = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => root.render(<OverlayHarness />));

  const opener = container.querySelector<HTMLButtonElement>("[data-opener]")!;
  opener.focus();
  await act(async () => opener.click());

  return { container, opener };
};

beforeEach(() => {
  navMocks.scrollTo.mockReset();
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
});

describe("OverlayNav", () => {
  it("Escape 키로 닫을 때 문서 본문과 이전 포커스를 복원한다", async () => {
    document.body.style.overflow = "clip";
    const { container, opener } = await mountOverlay();
    const overlay = container.querySelector<HTMLElement>("[data-open]")!;
    const trigger = container.querySelector<HTMLButtonElement>("[data-trigger]")!;

    expect(overlay.dataset.open).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(trigger);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(overlay.dataset.open).toBe("false");
    expect(document.body.style.overflow).toBe("clip");
    expect(document.activeElement).toBe(opener);
  });

  it("내비게이션 항목을 선택하면 닫힌 다음 프레임에 섹션을 이동한다", async () => {
    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 17;
      }),
    );
    const { container } = await mountOverlay();
    const overlay = container.querySelector<HTMLElement>("[data-open]")!;
    const projectButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("aside nav button"),
    ).find((button) => button.textContent?.includes("Projects"))!;

    await act(async () => projectButton.click());

    expect(overlay.dataset.open).toBe("false");
    expect(navMocks.scrollTo).not.toHaveBeenCalled();

    await act(async () => frameCallback?.(16));

    expect(navMocks.scrollTo).toHaveBeenCalledWith("projects");
  });
});
