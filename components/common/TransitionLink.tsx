"use client";

import { forwardRef, useEffect } from "react";
import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { useRouteTransition } from "./RouteTransition";

type TransitionLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onNavigate"> & {
  href: string;
  label: string;
};

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  ({ href, label, ...props }, ref) => {
    const { navigate, warmRoute } = useRouteTransition();

    useEffect(() => {
      warmRoute(href);
    }, [href, warmRoute]);

    return (
      <Link
        {...props}
        ref={ref}
        href={href}
        onNavigate={(event) => {
          event.preventDefault();
          navigate(href, label);
        }}
      />
    );
  },
);

TransitionLink.displayName = "TransitionLink";
