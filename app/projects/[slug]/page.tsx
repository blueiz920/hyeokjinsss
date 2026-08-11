import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KFestivalDetail } from "@/components/sections/KFestivalDetail";
import { MoumDetail } from "@/components/sections/MoumDetail";
import { YajobaDetail } from "@/components/sections/YajobaDetail";
import { portfolio } from "@/data/portfolio";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

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
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = findProject(slug);

  if (!project) {
    notFound();
  }

  if (project.slug === "moum-zip") {
    return <MoumDetail project={project} />;
  }

  if (project.slug === "k-festival") {
    return <KFestivalDetail project={project} />;
  }

  return <YajobaDetail project={project} />;
}
