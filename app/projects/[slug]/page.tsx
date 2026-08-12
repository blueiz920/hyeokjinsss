import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { KFestivalDetail } from "@/components/sections/KFestivalDetail";
import { MoumDetail } from "@/components/sections/MoumDetail";
import { YajobaDetail } from "@/components/sections/YajobaDetail";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";
import type { Project } from "@/data/types";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type DetailRenderer = (project: Project) => ReactNode;

export const dynamicParams = false;

const detailBySlug = new Map<string, DetailRenderer>([
  ["moum-zip", (project) => <MoumDetail project={project} />],
  ["k-festival", (project) => <KFestivalDetail project={project} />],
  ["yajoba", (project) => <YajobaDetail project={project} />],
]);

function findProject(slug: string) {
  return portfolio.projects.find((project) => project.slug === slug);
}

export function generateStaticParams() {
  return portfolio.projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: project.title,
      description: project.summary,
      url: `/projects/${project.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: project.ogImage,
          width: 1200,
          height: 630,
          alt: `${project.title} 프로젝트 대표 이미지`,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = findProject(slug);

  if (!project) {
    notFound();
  }

  const renderDetail = detailBySlug.get(project.slug);

  if (!renderDetail) {
    notFound();
  }

  return renderDetail(project);
}
