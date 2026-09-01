import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { KFestivalDetail } from "@/components/sections/KFestivalDetail";
import { MoumDetail } from "@/components/sections/MoumDetail";
import type { DetailOrder } from "@/components/sections/ProjectDetail";
import { YajobaDetail } from "@/components/sections/YajobaDetail";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";
import type { Project, ProjectSlug } from "@/data/types";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type DetailRenderer = (project: Project, order: DetailOrder) => ReactNode;

export const dynamicParams = false;

const detailBySlug = {
  "moum-zip": (project, order) => (
    <MoumDetail project={project} order={order} />
  ),
  "k-festival": (project, order) => (
    <KFestivalDetail project={project} order={order} />
  ),
  yajoba: (project, order) => <YajobaDetail project={project} order={order} />,
} satisfies Record<ProjectSlug, DetailRenderer>;

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
    title: project.seoTitle,
    description: project.seoDescription,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: project.seoTitle,
      description: project.seoDescription,
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

  const renderDetail = detailBySlug[project.slug];
  const projectIndex = portfolio.projects.findIndex(
    ({ slug: projectSlug }) => projectSlug === project.slug,
  );
  const nextProject =
    portfolio.projects[(projectIndex + 1) % portfolio.projects.length];

  if (projectIndex < 0 || !nextProject) {
    notFound();
  }

  return renderDetail(project, {
    index: projectIndex + 1,
    total: portfolio.projects.length,
    nextProject,
  });
}
