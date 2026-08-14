import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TransitionLink } from "./TransitionLink";

const linkMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  preload: vi.fn(),
}));

vi.mock("./RouteTransition", () => ({
  useRouteTransition: () => ({ navigate: linkMocks.navigate, preload: linkMocks.preload }),
}));

let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  window.history.replaceState({}, "", "/");
  linkMocks.navigate.mockReset();
  linkMocks.preload.mockReset();
});

const mountLink = async (props: Partial<React.ComponentProps<typeof TransitionLink>> = {}) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  await act(async () => {
    root.render(
      <TransitionLink href="/projects/moum-zip" label="모음집" {...props}>
        Project
      </TransitionLink>,
    );
  });

  return container.querySelector<HTMLAnchorElement>("a")!;
};

describe("TransitionLink", () => {
  it("수정 키가 없는 기본 내부 링크 클릭을 가로챈다", async () => {
    const link = await mountLink();

    expect(linkMocks.preload).toHaveBeenCalledWith("/projects/moum-zip");

    await act(async () => link.click());

    expect(linkMocks.navigate).toHaveBeenCalledWith("/projects/moum-zip", "모음집");
  });

  it("수정 키·외부·다운로드·대상 속성이 있는 링크 동작은 유지한다", async () => {
    const cases = [
      { props: {}, event: new MouseEvent("click", { bubbles: true, button: 0, metaKey: true }) },
      { props: { href: "https://example.com" }, event: new MouseEvent("click", { bubbles: true, button: 0 }) },
      { props: { download: "project.pdf" }, event: new MouseEvent("click", { bubbles: true, button: 0 }) },
      { props: { target: "_blank" }, event: new MouseEvent("click", { bubbles: true, button: 0 }) },
    ];

    for (const { props, event } of cases) {
      const link = await mountLink(props);
      await act(async () => link.dispatchEvent(event));
    }

    expect(linkMocks.navigate).not.toHaveBeenCalled();
  });
});
