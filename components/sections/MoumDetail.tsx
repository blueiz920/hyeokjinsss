import Image from "next/image";
import type { Project } from "@/data/types";
import { TransitionLink } from "@/components/common/TransitionLink";
import { ProjectNext } from "@/components/sections/ProjectNext";

type MoumDetailProps = {
  project: Project;
};

const chapters = [
  { id: "rendering", index: "01", label: "렌더링 경로" },
  { id: "search-state", index: "02", label: "검색 상태" },
  { id: "discovery", index: "03", label: "발견 경로" },
  { id: "activity", index: "04", label: "활동 시각화" },
];

export const MoumDetail = ({ project }: MoumDetailProps) => {
  const liveLink = project.links.find(({ label }) => label === "Live");
  const githubLink = project.links.find(({ label }) => label === "GitHub");

  return (
    <>
      <main className="project-detail" data-project-detail="moum-zip">
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
            <p>Case 01 / 03</p>
          </div>

          <div className="project-detail-heading">
            <p className="project-detail-eyebrow">Community platform</p>
            <h1 id="project-title">{project.title}</h1>
          </div>

          <div className="project-detail-intro">
            <p className="project-detail-summary">
              느린 첫 화면과 사라지는 검색 조건을 고쳤습니다. 새 모임도 검색
              엔진에 잡히도록 했습니다.
            </p>
            <p className="project-detail-context">
              스터디·프로젝트 모임을 검색하고 운영하는 플랫폼입니다. 검색 상태,
              SEO, 활동 시각화 흐름을 맡았습니다.
            </p>
          </div>

          <dl className="project-detail-meta">
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>2026.03 — 2026.04</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Search · Performance · SEO</dd>
            </div>
            <div>
              <dt>Links</dt>
              <dd className="project-detail-links">
                {liveLink ? (
                  <a href={liveLink.href} target="_blank" rel="noopener noreferrer">
                    Live ↗
                  </a>
                ) : null}
                {githubLink ? (
                  <a href={githubLink.href} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
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
            alt="모음.zip 검색 화면"
            width={1200}
            height={693}
            priority
          />
        </div>
        <figcaption>스터디와 프로젝트 모임을 탐색하는 검색 화면</figcaption>
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
            <p className="project-detail-lead">
              문제는 기능 수가 아니었습니다. 찾고, 돌아오고, 다시 발견하는
              흐름이 자주 끊겼습니다.
            </p>

            <section id="rendering" className="project-detail-chapter">
              <header>
                <p>01 / Rendering</p>
                <h2>먼저 보여야 할 화면</h2>
              </header>
              <div className="project-detail-prose">
                <p>
                  검색 결과와 카테고리 조회를 서버에서 함께 기다리느라 초기 HTML
                  응답과 히어로 렌더가 늦었습니다. Lighthouse로 병목을 확인한 뒤,
                  사용자가 가장 먼저 보는 히어로를 데이터 조회 경로에서
                  분리했습니다.
                </p>
                <p>
                  나머지 데이터는 non-blocking prefetch와 Suspense fallback으로
                  넘겼습니다. 첫 화면이 결과 목록을 기다리지 않도록 했습니다.
                </p>
              </div>

              <figure className="project-evidence project-evidence-performance">
                <div className="project-evidence-heading">
                  <p>Largest Contentful Paint</p>
                  <strong>1.5s → 0.8s</strong>
                </div>
                <div className="project-render-paths" aria-label="렌더링 경로 변경 전후">
                  <div>
                    <span>Before</span>
                    <ol>
                      <li>검색 결과</li>
                      <li>카테고리</li>
                      <li>Hero render</li>
                    </ol>
                  </div>
                  <div>
                    <span>After</span>
                    <ol>
                      <li>Hero render</li>
                      <li>Suspense fallback</li>
                      <li>검색 결과</li>
                    </ol>
                  </div>
                </div>
                <figcaption>렌더링 경로를 나눠 LCP를 약 45% 줄였습니다.</figcaption>
              </figure>
            </section>

            <section id="search-state" className="project-detail-chapter">
              <header>
                <p>02 / Search state</p>
                <h2>검색 조건을 주소에 담다</h2>
              </header>
              <div className="project-detail-prose">
                <p>
                  화면 안에만 있던 키워드·카테고리·지역·정렬 조건을 URL 쿼리와
                  연결했습니다. 새로고침하거나 검색 결과를 공유해도, 뒤로 가기를
                  사용해도 같은 조건으로 돌아옵니다.
                </p>
                <p>
                  인증 여부에 따른 좋아요·참여 분기까지 포함했습니다. 검색
                  파라미터와 결과 매핑 로직은 Vitest 43개 케이스로 검증했습니다.
                </p>
              </div>

              <figure className="project-evidence project-evidence-query">
                <div className="project-query-values" aria-hidden="true">
                  <span>Keyword</span>
                  <b>프론트엔드</b>
                  <span>Region</span>
                  <b>온라인</b>
                  <span>Sort</span>
                  <b>최신순</b>
                </div>
                <code>?keyword=frontend&amp;region=online&amp;sort=latest</code>
                <figcaption>화면 상태를 주소로 옮겨 탐색 흐름을 복원 가능하게 했습니다.</figcaption>
              </figure>
            </section>

            <section id="discovery" className="project-detail-chapter">
              <header>
                <p>03 / Discovery</p>
                <h2>새 모임도 검색되도록</h2>
              </header>
              <div className="project-detail-prose">
                <p>
                  정적 페이지 중심의 sitemap에는 새로 생긴 모임 상세 페이지를
                  담을 수 없었습니다. 목록 API를 cursor 기반으로 끝까지 순회해
                  URL을 모으고, 중복을 제거한 뒤 동적 sitemap에 반영했습니다.
                </p>
                <p>
                  매 요청마다 전체 목록을 다시 수집하지 않도록 6시간 단위
                  재검증을 적용했습니다. 크롤링 범위와 서버 비용 사이의 균형을
                  맞췄습니다.
                </p>
              </div>

              <figure className="project-evidence project-evidence-flow">
                <ol aria-label="동적 sitemap 생성 과정">
                  <li><span>01</span>Cursor pages</li>
                  <li><span>02</span>Deduplicate</li>
                  <li><span>03</span>Dynamic sitemap</li>
                  <li><span>04</span>6h revalidate</li>
                </ol>
                <figcaption>새 콘텐츠가 생겨도 검색 엔진의 발견 경로가 이어집니다.</figcaption>
              </figure>
            </section>

            <section id="activity" className="project-detail-chapter">
              <header>
                <p>04 / Activity</p>
                <h2>모임 활동을 한눈에</h2>
              </header>
              <div className="project-detail-prose">
                <p>
                  모임 대시보드에서 멤버 활동을 한눈에 볼 수 있도록 게시글·댓글·
                  출석 데이터를 모은 잔디 기능을 제안하고 구현했습니다.
                </p>
                <p>
                  사용자별 결과는 cacheTag와 cacheLife로 재사용했습니다. 활동이
                  바뀌면 grass 태그를 무효화해 반복 조회를 줄이고 최신 상태를
                  유지했습니다.
                </p>
              </div>

              <figure className="project-evidence project-evidence-grass">
                <div className="project-grass-grid" aria-hidden="true">
                  {Array.from({ length: 35 }, (_, index) => (
                    <span key={index} data-level={(index * 7 + 3) % 5} />
                  ))}
                </div>
                <div className="project-cache-note">
                  <span>read</span>
                  <strong>cacheLife</strong>
                  <span>update</span>
                  <strong>grass tag invalidation</strong>
                </div>
                <figcaption>반복 조회는 줄이고, 새 활동은 바로 반영했습니다.</figcaption>
              </figure>
            </section>

            <footer className="project-detail-outcome">
              <p>What changed</p>
              <h2>
                빨리 찾고,
                <br />같은 조건으로 돌아오는 검색.
              </h2>
              <p>
                화면 하나의 속도 개선에 그치지 않았습니다. 검색 상태, 발견 경로,
                운영 데이터까지 한 흐름으로 묶었습니다.
              </p>
            </footer>
          </article>
        </div>
      </section>
      </main>

      <ProjectNext href="/projects/k-festival" title="K-Festival" />
    </>
  );
};
