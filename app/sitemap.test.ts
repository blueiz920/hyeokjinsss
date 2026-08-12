import { describe, expect, it } from "vitest";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes the homepage and every project detail route", () => {
    const entries = sitemap();

    expect(entries.map(({ url }) => url)).toEqual([
      siteConfig.url,
      ...portfolio.projects.map(
        ({ slug }) => `${siteConfig.url}/projects/${slug}`,
      ),
    ]);
  });
});
