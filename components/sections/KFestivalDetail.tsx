import { ProjectDetail, type DetailChapter } from "@/components/sections/ProjectDetail";
import type { Project } from "@/data/types";

type KFestivalDetailProps = {
  project: Project;
};

const chapters: DetailChapter[] = [
  { id: "festival-data", index: "01", label: "목록 데이터" },
  { id: "deploy-proxy", index: "02", label: "배포 프록시" },
  { id: "image-upload", index: "03", label: "이미지 업로드" },
  { id: "language-state", index: "04", label: "다국어 상태" },
];

export const KFestivalDetail = ({ project }: KFestivalDetailProps) => (
  <ProjectDetail
    project={project}
    caseIndex="02"
    eyebrow="Travel platform"
    summary="축제 카드마다 발생하던 상세 요청을 없앴습니다. 배포 환경에서 막힌 API와 이미지 업로드 경로도 복구했습니다."
    context="외국인 관광객을 위한 한국 축제 탐색·커뮤니티 플랫폼입니다. 온보딩과 축제 탐색 화면, 배포 환경을 맡았습니다."
    period="2025.04 — 2025.11"
    focus="Festival UI · Deployment"
    coverAlt="K-Festival 축제 탐색 화면"
    coverCaption="전국과 기간을 기준으로 한국 축제를 탐색하는 화면"
    chapters={chapters}
    lead="축제 화면과 Vercel 배포를 맡고 API 응답 구조까지 조정했습니다."
    outcomeTitle={<>상세 요청 8건 제거와<br />배포 경로 복구.</>}
    outcomeBody="카드에 필요한 기간은 목록 응답에서 받고, 배포 환경의 API와 이미지 업로드는 Serverless 프록시로 중계했습니다."
    nextHref="/projects/yajoba"
    nextTitle="Yajoba"
  >
    <section id="festival-data" className="project-detail-chapter">
      <header>
        <p>01 / Festival data</p>
        <h2>카드별 상세 요청을 없애다</h2>
      </header>
      <div className="project-detail-prose">
        <p>축제 기간이 목록·검색 응답에 없어서 카드마다 상세 API를 다시 호출했습니다. 한 페이지에서 최대 8번의 요청이 추가되는 구조였습니다.</p>
        <p>카드 렌더링에서 호출을 우회하지 않고 백엔드에 시작일과 종료일 필드 추가를 제안했습니다. 목록 응답만으로 기간을 그리게 바꿔 추가 요청을 8회에서 0회로 줄였습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-performance">
        <div className="project-evidence-heading">
          <p>추가 상세 요청</p>
          <strong>8 → 0</strong>
        </div>
        <div className="project-render-paths" aria-label="축제 카드 요청 구조 변경 전후">
          <div>
            <span>Before</span>
            <ol><li>축제 목록</li><li>상세 조회 × 8</li><li>카드 렌더링</li></ol>
          </div>
          <div>
            <span>After</span>
            <ol><li>축제 목록</li><li>기간 필드</li><li>카드 렌더링</li></ol>
          </div>
        </div>
        <figcaption>목록 응답 계약을 바꿔 카드별 상세 요청을 없앴습니다.</figcaption>
      </figure>
    </section>

    <section id="deploy-proxy" className="project-detail-chapter">
      <header>
        <p>02 / Deploy proxy</p>
        <h2>HTTP API를 프록시로 잇다</h2>
      </header>
      <div className="project-detail-prose">
        <p>Vercel의 HTTPS 페이지에서 HTTP 백엔드를 직접 호출하자 브라우저가 Mixed Content 요청을 막았습니다.</p>
        <p>백엔드가 HTTPS로 전환되기 전까지 Serverless 프록시를 통신 경계로 두었습니다. 브라우저는 HTTPS만 호출하고, 서버가 HTTP API를 중계하도록 나눠 운영 환경을 복구했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="Vercel 프록시 요청 경로">
          <li><span>01</span>HTTPS 브라우저</li>
          <li><span>02</span>/api/proxy</li>
          <li><span>03</span>HTTP 백엔드</li>
          <li><span>04</span>응답</li>
        </ol>
        <figcaption>브라우저에는 HTTPS 경로만 노출하고 HTTP 연결은 프록시 안으로 옮겼습니다.</figcaption>
      </figure>
    </section>

    <section id="image-upload" className="project-detail-chapter">
      <header>
        <p>03 / Image upload</p>
        <h2>multipart 요청을 그대로 전달하다</h2>
      </header>
      <div className="project-detail-prose">
        <p>프록시가 multipart 요청을 req.body로 다시 만들면서 boundary와 실제 본문이 어긋났습니다. 형식이 깨진 요청을 받은 백엔드는 파일을 읽지 못하고 500을 반환했습니다.</p>
        <p>원본 요청 스트림을 fetch body로 직접 전달하고 duplex 옵션을 적용했습니다. 프록시가 multipart 본문을 다시 해석하지 않게 해 이미지 데이터를 보존했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-query">
        <div className="project-query-values" aria-hidden="true">
          <span>변경 전</span><b>req.body 재전송</b>
          <span>변경 후</span><b>원본 요청 스트림</b>
          <span>결과</span><b>multipart 형식 보존</b>
        </div>
        <code>fetch(apiUrl, &#123; body: req, duplex: &quot;half&quot; &#125;)</code>
        <figcaption>프록시 구간에서 깨지던 커뮤니티 이미지 업로드를 복구했습니다.</figcaption>
      </figure>
    </section>

    <section id="language-state" className="project-detail-chapter">
      <header>
        <p>04 / Language state</p>
        <h2>언어 변경에 맞춰 다시 요청하다</h2>
      </header>
      <div className="project-detail-prose">
        <p>UI 언어를 바꿔도 서버 데이터는 이전 언어로 남을 수 있었습니다. 화면과 축제 정보가 서로 다른 언어를 쓰는 문제였습니다.</p>
        <p>Zustand의 언어 상태를 기준으로 i18next와 API lang 파라미터, queryKey를 연결했습니다. 언어가 바뀌면 기존 캐시를 구분하고 해당 언어의 데이터를 다시 요청합니다.</p>
      </div>
      <figure className="project-evidence project-evidence-query">
        <div className="project-query-values" aria-hidden="true">
          <span>상태</span><b>Zustand language</b>
          <span>화면</span><b>i18next</b>
          <span>데이터</span><b>lang + queryKey</b>
        </div>
        <code>[&quot;festivals&quot;, language, filters]</code>
        <figcaption>목록·검색·상세 화면의 문구와 서버 데이터가 같은 언어를 따릅니다.</figcaption>
      </figure>
    </section>
  </ProjectDetail>
);
