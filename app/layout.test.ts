import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTRO_SESSION_BOOTSTRAP } from "@/lib/animation/introSession";

const layoutSource = readFileSync(
  resolve(process.cwd(), "app/layout.tsx"),
  "utf8",
);

describe("루트 레이아웃 인트로 세션 부트스트랩", () => {
  it("hydration 전 세션 생략을 파서 차단형 head 스크립트로 처리한다", () => {
    expect(layoutSource).toContain("<head>");
    expect(layoutSource).toContain('id="intro-session-bootstrap"');
    expect(layoutSource).toContain("dangerouslySetInnerHTML");
    expect(layoutSource).toContain("INTRO_SESSION_BOOTSTRAP");
    expect(INTRO_SESSION_BOOTSTRAP).toContain("sessionStorage.getItem");
    expect(INTRO_SESSION_BOOTSTRAP).toContain(
      'document.documentElement.dataset.introSeen="true"',
    );
    expect(layoutSource).not.toContain('from "next/script"');
    expect(layoutSource).not.toContain('strategy="beforeInteractive"');
    expect(layoutSource).toMatch(/<html[\s\S]*suppressHydrationWarning/);
  });
});
