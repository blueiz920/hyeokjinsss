import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransitionLink } from "@/components/common/TransitionLink";
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-5 py-24 sm:px-8">
      <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
        {project.title}
      </h1>
      <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
        {project.summary}
      </p>
      <TransitionLink
        href="/"
        label="Projects"
        className="w-fit text-sm text-amber-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
      >
        Projects
      </TransitionLink>
    </main>
  );
}
