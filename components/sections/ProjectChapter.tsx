import type { ReactNode } from "react";

export type DetailChapter = {
  id: string;
  index: string;
  label: string;
};

type ProjectChapterProps = {
  chapter: DetailChapter;
  kicker: string;
  title: string;
  children: ReactNode;
};

export const ProjectChapter = ({
  chapter,
  kicker,
  title,
  children,
}: ProjectChapterProps) => (
  <section id={chapter.id} className="project-detail-chapter">
    <header>
      <p>{chapter.index} / {kicker}</p>
      <h2>{title}</h2>
    </header>
    {children}
  </section>
);
