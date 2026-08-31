import type { SectionId } from "@/data/types";

export const SECTION_INTENT_EVENT = "portfolio:section-intent";

export type SectionIntentDetail = {
  id: SectionId;
  phase: "start" | "end";
};
