import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroLoaderGate } from "./IntroLoaderGate";

const gateMocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => gateMocks.pathname,
}));

vi.mock("./IntroLoader", () => ({
  IntroLoader: () => <div data-intro-loader />,
}));

let mountedRoots: Root[] = [];

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

beforeEach(() => {
  gateMocks.pathname = "/";
});

afterEach(async () => {
  for (const root of mountedRoots) {
    await act(async () => root.unmount());
  }
  mountedRoots = [];
  document.body.replaceChildren();
  vi.clearAllMocks();
});

const mountGate = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  mountedRoots.push(root);

  const render = async () => {
    await act(async () => root.render(<IntroLoaderGate />));
  };

  await render();
  return { container, render };
};

describe("IntroLoaderGate", () => {
  it("keeps the loader limited to a document that entered through home", async () => {
    const { container, render } = await mountGate();

    expect(container.querySelector("[data-intro-loader]")).not.toBeNull();

    gateMocks.pathname = "/projects/moum-zip";
    await render();

    expect(container.querySelector("[data-intro-loader]")).not.toBeNull();
  });

  it("does not start the loader after entering through a project route", async () => {
    gateMocks.pathname = "/projects/moum-zip";
    const { container, render } = await mountGate();

    expect(container.querySelector("[data-intro-loader]")).toBeNull();

    gateMocks.pathname = "/";
    await render();

    expect(container.querySelector("[data-intro-loader]")).toBeNull();
  });
});
