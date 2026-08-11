"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { coverRoute, resetRoute, revealRoute } from "@/lib/animation/routeTransition";
import { useScrollRuntime } from "@/hooks/useScrollRuntime";

type RouteTransitionValue = {
  navigate: (href: string, label: string) => void;
};

type PendingRoute = {
  href: string;
  label: string;
};

const RouteTransitionContext = createContext<RouteTransitionValue | null>(null);
const ROUTE_TIMEOUT_MS = 5000;

const isNewPath = (currentPath: string, href: string) => {
  const target = new URL(href, window.location.href);
  return target.pathname !== currentPath;
};

const pushRoute = (router: { push: (href: string) => void }, href: string) => {
  try {
    router.push(href);
  } catch (error) {
    console.error("Router navigation failed; using document navigation.", error);
    window.location.assign(href);
  }
};

export const RouteTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { lockScroll, prefersReducedMotion, unlockScroll } = useScrollRuntime();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef(pathname);
  const pendingRef = useRef<PendingRoute | null>(null);
  const ownsLockRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [label, setLabel] = useState("");

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const releaseRoute = useCallback(() => {
    clearTimer();
    pendingRef.current = null;
    if (rootRef.current) resetRoute(rootRef.current);
    delete document.documentElement.dataset.routeLocked;
    if (ownsLockRef.current) {
      ownsLockRef.current = false;
      unlockScroll();
    }
    setIsActive(false);
  }, [clearTimer, unlockScroll]);

  const navigate = useCallback(
    async (href: string, nextLabel: string) => {
      if (prefersReducedMotion || !isNewPath(pathRef.current, href)) {
        pushRoute(router, href);
        return;
      }
      if (pendingRef.current || !rootRef.current) return;

      const pending = { href, label: nextLabel };
      pendingRef.current = pending;
      setLabel(nextLabel);
      setIsActive(true);
      document.documentElement.dataset.routeLocked = "true";
      ownsLockRef.current = true;
      lockScroll();
      timerRef.current = window.setTimeout(releaseRoute, ROUTE_TIMEOUT_MS);

      try {
        await coverRoute(rootRef.current);
        if (pendingRef.current !== pending) return;
        pushRoute(router, href);
      } catch (error) {
        if (pendingRef.current !== pending) return;
        console.error("Route transition failed; continuing navigation.", error);
        releaseRoute();
        pushRoute(router, href);
      }
    },
    [lockScroll, prefersReducedMotion, releaseRoute, router],
  );

  useEffect(() => {
    if (pathname === pathRef.current) return;

    pathRef.current = pathname;
    if (!pendingRef.current || !rootRef.current) return;

    let alive = true;
    const pending = pendingRef.current;
    void (async () => {
      try {
        await revealRoute(rootRef.current!);
      } catch (error) {
        if (alive) console.error("Route reveal failed; restoring input.", error);
      } finally {
        if (alive && pendingRef.current === pending) releaseRoute();
      }
    })();

    return () => {
      alive = false;
    };
  }, [pathname, releaseRoute]);

  useEffect(
    () => () => {
      clearTimer();
      if (rootRef.current) resetRoute(rootRef.current);
      delete document.documentElement.dataset.routeLocked;
      if (ownsLockRef.current) {
        ownsLockRef.current = false;
        unlockScroll();
      }
    },
    [clearTimer, unlockScroll],
  );

  return (
    <RouteTransitionContext.Provider value={{ navigate }}>
      {children}
      <div
        ref={rootRef}
        className="route-transition"
        data-active={isActive ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="route-transition-screen" data-route-screen>
          <div className="route-transition-top-curve" data-route-top-curve>
            <div className="route-transition-curve-shape" />
          </div>
          <p className="route-transition-label" data-route-label>
            {label}
          </p>
          <div className="route-transition-bottom-curve" data-route-bottom-curve>
            <div className="route-transition-curve-shape" />
          </div>
        </div>
      </div>
    </RouteTransitionContext.Provider>
  );
};

export const useRouteTransition = () => {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error("useRouteTransition must be used within RouteTransition");
  }
  return context;
};
