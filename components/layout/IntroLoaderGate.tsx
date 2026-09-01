"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { markIntroReady } from "@/lib/animation/introLoader";
import { IntroLoader } from "./IntroLoader";

export const IntroLoaderGate = () => {
  const pathname = usePathname();
  const [initialPath] = useState(pathname);

  useEffect(() => {
    if (initialPath !== "/" && pathname === "/") markIntroReady();
  }, [initialPath, pathname]);

  return initialPath === "/" ? <IntroLoader /> : null;
};
