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

function buildProjectSchema(project: Project) {
  const liveLink = project.links.find(({ kind }) => kind === "live");
  const githubLink = project.links.find(({ kind }) => kind === "github");

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.seoDescription,
    url: new URL(`/projects/${project.slug}`, siteConfig.url).toString(),
    image: new URL(project.ogImage, siteConfig.url).toString(),
    inLanguage: "ko-KR",
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      alternateName: siteConfig.author.alternateName,
      url: siteConfig.url,
    },
    keywords: project.stack,
    about: {
      "@type": "SoftwareApplication",
      name: project.title,
      description: project.summary,
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      ...(liveLink ? { url: liveLink.href } : {}),
      ...(githubLink ? { sameAs: githubLink.href } : {}),
    },
  };
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

  const projectSchema = buildProjectSchema(project);

  return (
    <>
      <script
        id={`project-schema-${project.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectSchema).replace(/</g, "\\u003c"),
        }}
      />
      {renderDetail(project, {
        index: projectIndex + 1,
        total: portfolio.projects.length,
        nextProject,
      })}
    </>
  );
}
