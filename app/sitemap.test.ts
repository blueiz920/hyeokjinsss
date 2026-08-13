import { describe, expect, it } from "vitest";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("홈과 모든 프로젝트 상세 경로를 포함한다", () => {
    const entries = sitemap();

    expect(entries.map(({ url }) => url)).toEqual([
      siteConfig.url,
      ...portfolio.projects.map(
        ({ slug }) => `${siteConfig.url}/projects/${slug}`,
      ),
    ]);
  });
});
