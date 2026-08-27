import type { ReactNode } from "react";
import Image from "next/image";
import { TransitionLink } from "@/components/common/TransitionLink";
import { ProjectNext } from "@/components/sections/ProjectNext";
import type { Project } from "@/data/types";

export type DetailChapter = {
  id: string;
  index: string;
  label: string;
};

export type DetailOrder = {
  index: number;
  total: number;
  nextProject: Pick<Project, "slug" | "title">;
};

type ProjectDetailProps = {
  project: Project;
  order: DetailOrder;
  eyebrow: string;
  summary: string;
  context: string;
  period: string;
  focus: string;
  coverAlt: string;
  coverCaption: string;
  chapters: DetailChapter[];
  lead: string;
  children: ReactNode;
  outcomeTitle: ReactNode;
  outcomeBody: string;
};

export const ProjectDetail = ({
  project,
  order,
  eyebrow,
  summary,
  context,
  period,
  focus,
  coverAlt,
  coverCaption,
  chapters,
  lead,
  children,
  outcomeTitle,
  outcomeBody,
}: ProjectDetailProps) => {
  const liveLink = project.links.find(({ kind }) => kind === "live");
  const githubLink = project.links.find(({ kind }) => kind === "github");
  const caseIndex = String(order.index).padStart(2, "0");
  const caseTotal = String(order.total).padStart(2, "0");

  return (
    <>
      <main className="project-detail" data-project-detail={project.slug}>
        <section className="project-detail-hero" aria-labelledby="project-title">
          <div className="project-detail-shell">
            <div className="project-detail-topline">
              <TransitionLink
                href="/#projects"
                label="Projects"
                className="project-detail-back"
              >
                <span aria-hidden="true">←</span>
                Projects
              </TransitionLink>
              <p>Case {caseIndex} / {caseTotal}</p>
            </div>

            <div className="project-detail-heading">
              <p className="project-detail-eyebrow">{eyebrow}</p>
              <h1 id="project-title">{project.title}</h1>
            </div>

            <div className="project-detail-intro">
              <p className="project-detail-summary">{summary}</p>
              <p className="project-detail-context">{context}</p>
            </div>

            <dl className="project-detail-meta">
              <div>
                <dt>Contribution</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>{period}</dd>
              </div>
              <div>
                <dt>Ownership</dt>
                <dd>{focus}</dd>
              </div>
              <div>
                <dt>Links</dt>
                <dd className="project-detail-links">
                  {liveLink ? (
                    <a href={liveLink.href} target="_blank" rel="noopener noreferrer">
                      {liveLink.label} ↗
                    </a>
                  ) : null}
                  {githubLink ? (
                    <a href={githubLink.href} target="_blank" rel="noopener noreferrer">
                      {githubLink.label} ↗
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <figure className="project-detail-cover">
          <div className="project-detail-cover-frame">
            <Image
              src={project.thumbnail}
              alt={coverAlt}
              width={1200}
              height={693}
              priority
            />
          </div>
          <figcaption>{coverCaption}</figcaption>
        </figure>

        <section className="project-detail-story" aria-label="프로젝트 개선 과정">
          <div className="project-detail-story-grid">
            <aside className="project-detail-index">
              <p>In this case</p>
              <nav aria-label="프로젝트 상세 목차">
                {chapters.map((chapter) => (
                  <a key={chapter.id} href={`#${chapter.id}`}>
                    <span>{chapter.index}</span>
                    {chapter.label}
                  </a>
                ))}
              </nav>
            </aside>

            <article className="project-detail-article">
              <p className="project-detail-lead">{lead}</p>
              {children}
              <footer className="project-detail-outcome">
                <p>What changed</p>
                <h2>{outcomeTitle}</h2>
                <p>{outcomeBody}</p>
              </footer>
            </article>
          </div>
        </section>
      </main>

      <ProjectNext
        href={`/projects/${order.nextProject.slug}`}
        title={order.nextProject.title}
      />
    </>
  );
};
