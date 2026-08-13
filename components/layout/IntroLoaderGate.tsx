"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IntroLoader } from "./IntroLoader";

export const IntroLoaderGate = () => {
  const pathname = usePathname();
  const [initialPath] = useState(pathname);

  return initialPath === "/" ? <IntroLoader /> : null;
};
