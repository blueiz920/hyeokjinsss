"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Project } from "@/data/types";

type ProjectDesktopListProps = {
  projects: Project[];
  prefersReducedMotion: boolean;
  setRowRef: (index: number, node: HTMLElement | null) => void;
};

const PREVIEW_EASE = 12;

// 데스크톱에서 프로젝트 행과 포인터 추종 미리보기를 함께 렌더링한다.
export const ProjectDesktopList = ({
  projects,
  prefersReducedMotion,
  setRowRef,
}: ProjectDesktopListProps) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const previewVisibleRef = useRef(false);
  const targetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  function drawPreview() {
    const preview = previewRef.current;

    if (!preview || !previewVisibleRef.current) {
      frameRef.current = null;
      return;
    }

    const target = targetRef.current;
    const position = positionRef.current;

    position.x += (target.x - position.x) / PREVIEW_EASE;
    position.y += (target.y - position.y) / PREVIEW_EASE;
    preview.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
    frameRef.current = requestAnimationFrame(drawPreview);
  }

  const startPreview = (
    index: number,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (
      prefersReducedMotion ||
      event.pointerType === "touch" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    targetRef.current = { x: event.clientX, y: event.clientY };

    if (!previewVisibleRef.current) {
      positionRef.current = { x: event.clientX, y: event.clientY };
    }

    previewVisibleRef.current = true;
    setPreviewIndex(index);
    setPreviewVisible(true);

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(drawPreview);
    }
  };

  const movePreview = (event: ReactPointerEvent<HTMLElement>) => {
    if (!previewVisibleRef.current) return;
    targetRef.current = { x: event.clientX, y: event.clientY };
  };

  const stopPreview = () => {
    previewVisibleRef.current = false;
    setPreviewVisible(false);

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  useEffect(
    () => () => {
      previewVisibleRef.current = false;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const previewProject = projects[previewIndex] ?? projects[0];

  return (
    <>
      <ul className="project-desktop-list" aria-label="프로젝트 목록">
        {projects.map((project, index) => (
          <li
            key={project.slug}
            ref={(node) => setRowRef(index, node)}
            className="project-desktop-item"
            onPointerEnter={(event) => startPreview(index, event)}
            onPointerMove={movePreview}
            onPointerLeave={stopPreview}
          >
            <article
              className="project-desktop-row"
              aria-label={project.title}
            >
              <div className="project-desktop-heading">
                <p className="project-desktop-role">{project.role}</p>
                <h3 className="project-desktop-title">{project.title}</h3>
                <p className="project-desktop-impact">{project.impact}</p>
              </div>

              <div className="project-desktop-meta">
                <p>{project.summary}</p>
                <div className="project-desktop-links">
                  {project.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} ${link.label} 새 탭에서 열기`}
                    >
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {previewProject ? (
        <div
          ref={previewRef}
          className="project-desktop-preview"
          data-visible={previewVisible ? "true" : "false"}
          aria-hidden="true"
        >
          <div className="project-desktop-preview-surface">
            <Image
              src={previewProject.thumbnail}
              alt=""
              fill
              className="object-cover"
              sizes="396px"
            />
            <div className="project-desktop-preview-shade" />
            <span className="project-desktop-preview-action">
              보기
              <span>↗</span>
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
};
