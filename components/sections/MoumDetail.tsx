import { ProjectDetail, type DetailChapter } from "@/components/sections/ProjectDetail";
import type { Project } from "@/data/types";

type MoumDetailProps = {
  project: Project;
};

const chapters: DetailChapter[] = [
  { id: "rendering", index: "01", label: "렌더링 경로" },
  { id: "search-state", index: "02", label: "검색 상태" },
  { id: "discovery", index: "03", label: "동적 sitemap" },
  { id: "activity", index: "04", label: "활동 시각화" },
];

export const MoumDetail = ({ project }: MoumDetailProps) => (
  <ProjectDetail
    project={project}
    caseIndex="01"
    eyebrow="Community platform"
    summary="검색 페이지 · SSR 렌더링 최적화 · SEO · 활동 시각화"
    context="스터디·프로젝트 모임을 검색하고 운영하는 플랫폼입니다. 검색 상태, SEO, 활동 시각화 흐름을 맡았습니다."
    period="2026.03 — 2026.04"
    focus="Search page · SEO · Activity"
    coverAlt="모음.zip 검색 화면"
    coverCaption="스터디와 프로젝트 모임을 탐색하는 검색 화면"
    chapters={chapters}
    lead="검색 페이지를 전담해 렌더링, 상태 복원, SEO를 함께 개선했습니다."
    outcomeTitle={<>LCP 47% 개선과<br />검색 조건 복원.</>}
    outcomeBody="히어로 렌더링을 분리해 LCP를 낮췄습니다. 검색 조건은 URL에, 새 모임 URL은 sitemap에 남겼습니다."
    nextHref="/projects/k-festival"
    nextTitle="K-Festival"
  >
    <section id="rendering" className="project-detail-chapter">
      <header><p>01 / Rendering</p><h2>렌더 경로 분리·Suspense 스트리밍으로 LCP 47% 개선</h2></header>
      <div className="project-detail-prose">
        <p>검색 결과와 카테고리 조회가 끝나야 HTML을 내려주는 구조였습니다. Lighthouse에서 초기 응답과 히어로 렌더가 함께 늦어지는 병목을 확인했습니다.</p>
        <p>히어로를 데이터 조회 경로에서 분리해 먼저 렌더링했습니다. 나머지는 non-blocking prefetch와 Suspense fallback으로 넘겨 LCP를 1.5s에서 0.8s로 줄였습니다.</p>
        <a
          className="project-detail-related"
          href="https://www.notion.so/LCP-1-5-0-8-await-36baab22a6da812eba24c3fb312504fd?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LCP 개선 관련 글 자세히 보기, 새 탭에서 열기"
        >
          관련 글 자세히 보기 <span aria-hidden="true">↗</span>
        </a>
      </div>
      <figure className="project-evidence project-evidence-performance">
        <div className="project-evidence-heading"><p>Largest Contentful Paint</p><strong>1.5s → 0.8s</strong></div>
        <div className="project-render-paths" aria-label="렌더링 경로 변경 전후">
          <div><span>Before</span><ol><li>검색 결과</li><li>카테고리</li><li>히어로 렌더링</li></ol></div>
          <div><span>After</span><ol><li>히어로 렌더링</li><li>Suspense 대체 화면</li><li>검색 결과</li></ol></div>
        </div>
        <figcaption>측정 결과 LCP는 1.5s에서 0.8s로 약 47% 줄었습니다.</figcaption>
      </figure>
    </section>

    <section id="search-state" className="project-detail-chapter">
      <header><p>02 / Search state</p><h2>URL 상태 동기화와 43개 회귀 테스트</h2></header>
      <div className="project-detail-prose">
        <p>키워드·카테고리·지역·정렬 조건이 화면 상태로만 남아 새로고침과 공유, 뒤로 가기에서 사라졌습니다. 검색 상태는 URL을 기준으로 복원했습니다.</p>
        <p>인증 여부에 따른 좋아요·참여 분기까지 URL 상태와 연결했습니다. 검색 파라미터와 결과 매핑 로직은 Vitest 43개 케이스로 고정해 배포 전 회귀를 확인했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-query">
        <div className="project-query-values" aria-hidden="true"><span>검색어</span><b>프론트엔드</b><span>지역</span><b>온라인</b><span>정렬</span><b>최신순</b></div>
        <code>?keyword=frontend&amp;region=online&amp;sort=latest</code>
        <figcaption>검색 조건과 인증 분기를 43개 케이스로 검증했습니다.</figcaption>
      </figure>
    </section>

    <section id="discovery" className="project-detail-chapter">
      <header><p>03 / Discovery</p><h2>cursor 순회로 동적 sitemap 구축</h2></header>
      <div className="project-detail-prose">
        <p>정적 페이지 중심의 sitemap에는 새로 생긴 모임 상세 페이지가 빠졌습니다. 목록 API를 cursor 기반으로 끝까지 순회해 상세 URL을 수집하고 중복을 제거했습니다.</p>
        <p>전체 목록을 요청마다 다시 읽지 않도록 결과를 동적 sitemap에 반영하고 6시간 단위 재검증을 적용했습니다. 새 모임을 수집하면서도 반복 호출은 제한했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="동적 sitemap 생성 과정"><li><span>01</span>cursor 순회</li><li><span>02</span>중복 제거</li><li><span>03</span>동적 sitemap</li><li><span>04</span>6시간 재검증</li></ol>
        <figcaption>새 모임이 생기면 상세 페이지 URL도 sitemap에 포함됩니다.</figcaption>
      </figure>
    </section>

    <section id="activity" className="project-detail-chapter">
      <header><p>04 / Activity</p><h2>cacheTag 기반 활동 데이터 캐싱</h2></header>
      <div className="project-detail-prose">
        <p>대시보드에서 멤버 활동을 바로 확인할 수 있도록 게시글·댓글·출석 데이터를 집계한 잔디 기능을 제안하고 구현했습니다.</p>
        <p>사용자별 집계 결과는 cacheTag와 cacheLife로 캐시했습니다. 활동이 바뀌면 grass 태그를 무효화해 반복 조회와 최신 상태 반영을 함께 관리했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-grass">
        <div className="project-grass-grid" aria-hidden="true">{Array.from({ length: 35 }, (_, index) => <span key={index} data-level={(index * 7 + 3) % 5} />)}</div>
        <div className="project-cache-note"><span>조회</span><strong>cacheLife</strong><span>갱신</span><strong>grass 태그 무효화</strong></div>
        <figcaption>반복 조회는 줄이고, 새 활동은 바로 반영했습니다.</figcaption>
      </figure>
    </section>
  </ProjectDetail>
);
