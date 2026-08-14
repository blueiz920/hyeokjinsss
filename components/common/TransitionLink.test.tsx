import { act, forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TransitionLink } from "./TransitionLink";

const linkMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  warmRoute: vi.fn(),
}));

vi.mock("./RouteTransition", () => ({
  useRouteTransition: () => ({ navigate: linkMocks.navigate, warmRoute: linkMocks.warmRoute }),
}));

vi.mock("next/link", () => {
  const MockLink = forwardRef<
    HTMLAnchorElement,
    AnchorHTMLAttributes<HTMLAnchorElement> & {
      onNavigate?: (event: { preventDefault: () => void }) => void;
    }
  >(({ onNavigate, ...props }, ref) => (
    <a
      {...props}
      ref={ref}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          onNavigate?.({ preventDefault: () => event.preventDefault() });
        }
      }}
    />
  ));
  MockLink.displayName = "MockLink";
  return { default: MockLink };
});

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
  linkMocks.warmRoute.mockReset();
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
  it("내부 링크 이동을 곡면 전환으로 넘긴다", async () => {
    const link = await mountLink();

    expect(linkMocks.warmRoute).toHaveBeenCalledWith("/projects/moum-zip");

    await act(async () => link.click());

    expect(linkMocks.navigate).toHaveBeenCalledWith("/projects/moum-zip", "모음집");
  });
});
