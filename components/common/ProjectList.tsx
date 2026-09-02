"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Project } from "@/data/types";
import { ProjectRevealCard } from "@/components/common/ProjectRevealCard";

type ProjectListProps = {
  projects: Project[];
  prefersReducedMotion: boolean;
  setItemRef: (index: number, node: HTMLElement | null) => void;
};

const PREVIEW_EASE = 12;

// 반응형 프로젝트 목록과 데스크톱 포인터 추종 미리보기를 함께 렌더링한다.
export const ProjectList = ({
  projects,
  prefersReducedMotion,
  setItemRef,
}: ProjectListProps) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const previewVisibleRef = useRef(false);
  const targetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
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

  useEffect(() => {
    const query = window.matchMedia?.("(min-width: 1024px)");

    if (!query) return;

    const updateViewport = () => {
      setIsDesktop(query.matches);

      if (!query.matches) {
        previewVisibleRef.current = false;
        setPreviewVisible(false);

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      }
    };
    updateViewport();
    query.addEventListener?.("change", updateViewport);

    return () => query.removeEventListener?.("change", updateViewport);
  }, []);

  const startPreview = (
    index: number,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (
      !isDesktop ||
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

  return (
    <>
      <ul
        className="project-list"
        aria-label="프로젝트 목록"
        onPointerMove={movePreview}
        onPointerLeave={stopPreview}
      >
        {projects.map((project, index) => (
          <ProjectRevealCard
            key={project.slug}
            ref={(node) => setItemRef(index, node)}
            project={project}
            index={index}
            total={projects.length}
            prefersReducedMotion={prefersReducedMotion}
            isDesktop={isDesktop}
            onPointerEnter={(event) => startPreview(index, event)}
          />
        ))}
      </ul>

      {projects.length > 0 ? (
        <div
          ref={previewRef}
          className="project-desktop-preview"
          data-visible={previewVisible ? "true" : "false"}
          aria-hidden="true"
        >
          <div className="project-desktop-preview-surface">
            <div
              className="project-desktop-preview-track"
              style={{
                transform: `translate3d(0, -${previewIndex * 100}%, 0)`,
              }}
            >
              {projects.map((project) => (
                <div
                  key={project.slug}
                  className="project-desktop-preview-slide"
                  data-project={project.slug}
                >
                  <div className="project-desktop-preview-image">
                    <Image
                      src={project.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="396px"
                    />
                  </div>
                </div>
              ))}
            </div>
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
