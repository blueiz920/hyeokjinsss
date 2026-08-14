"use client";

import { forwardRef, useEffect } from "react";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransition";

type TransitionLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  label: string;
};

const canTransition = (event: MouseEvent<HTMLAnchorElement>) => {
  const link = event.currentTarget;
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;

  const target = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);
  if (target.origin !== current.origin) return false;

  return target.pathname !== current.pathname || target.search !== current.search;
};

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  ({ href, label, onClick, ...props }, ref) => {
    const { navigate, preload } = useRouteTransition();

    useEffect(() => {
      preload(href);
    }, [href, preload]);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (!canTransition(event)) return;

      event.preventDefault();
      navigate(href, label);
    };

    return <a {...props} ref={ref} href={href} onClick={handleClick} />;
  },
);

TransitionLink.displayName = "TransitionLink";
