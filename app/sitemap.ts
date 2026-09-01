import type { MetadataRoute } from "next";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const home = {
    url: siteConfig.url,
    changeFrequency: "monthly" as const,
    priority: 1,
  };
  const projects = portfolio.projects.map(({ slug }) => ({
    url: `${siteConfig.url}/projects/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [home, ...projects];
}
