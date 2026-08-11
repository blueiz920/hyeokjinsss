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
    summary="카드마다 반복되던 요청을 없앴습니다. 막혀 있던 배포와 이미지 업로드 경로도 다시 열었습니다."
    context="외국인 관광객을 위한 한국 축제 탐색·커뮤니티 플랫폼입니다. 온보딩과 축제 탐색 화면, 배포 환경을 맡았습니다."
    period="2025.04 — 2025.11"
    focus="Data flow · Proxy · i18n"
    coverAlt="K-Festival 축제 탐색 화면"
    coverCaption="전국과 기간을 기준으로 한국 축제를 탐색하는 화면"
    chapters={chapters}
    lead="로컬에서 되던 기능이 배포 뒤에 막혔습니다. 화면보다 요청이 지나가는 경로부터 확인했습니다."
    outcomeTitle={<>덜 요청하고,<br />배포 뒤에도 이어지는 흐름.</>}
    outcomeBody="목록 데이터부터 프록시와 언어 상태까지, 사용자가 축제를 찾고 글을 올리는 경로를 운영 환경에서도 끊기지 않게 만들었습니다."
    nextHref="/projects/yajoba"
    nextTitle="Yajoba"
  >
    <section id="festival-data" className="project-detail-chapter">
      <header>
        <p>01 / Festival data</p>
        <h2>카드마다 묻지 않도록</h2>
      </header>
      <div className="project-detail-prose">
        <p>축제 기간이 목록·검색 응답에 없어서 카드마다 상세 API를 다시 호출했습니다. 한 페이지에서 최대 8번의 요청이 추가되는 구조였습니다.</p>
        <p>백엔드에 시작일과 종료일 필드 추가를 제안했습니다. 목록 응답만으로 카드에 필요한 정보를 그릴 수 있게 했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-performance">
        <div className="project-evidence-heading">
          <p>Extra detail requests</p>
          <strong>8 → 0</strong>
        </div>
        <div className="project-render-paths" aria-label="축제 카드 요청 구조 변경 전후">
          <div>
            <span>Before</span>
            <ol><li>Festival list</li><li>Detail × 8</li><li>Card render</li></ol>
          </div>
          <div>
            <span>After</span>
            <ol><li>Festival list</li><li>Date fields</li><li>Card render</li></ol>
          </div>
        </div>
        <figcaption>한 페이지에서 발생하던 상세 요청을 목록 응답 하나로 줄였습니다.</figcaption>
      </figure>
    </section>

    <section id="deploy-proxy" className="project-detail-chapter">
      <header>
        <p>02 / Deploy proxy</p>
        <h2>HTTP API를 배포에 연결하다</h2>
      </header>
      <div className="project-detail-prose">
        <p>Vercel의 HTTPS 페이지에서 HTTP 백엔드를 직접 호출하자 브라우저가 Mixed Content 요청을 막았습니다.</p>
        <p>Serverless 프록시를 두고 브라우저 요청을 서버에서 HTTP API로 중계했습니다. 백엔드 전환을 기다리지 않고 배포 환경을 복구했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="Vercel 프록시 요청 경로">
          <li><span>01</span>HTTPS browser</li>
          <li><span>02</span>/api/proxy</li>
          <li><span>03</span>HTTP backend</li>
          <li><span>04</span>Response</li>
        </ol>
        <figcaption>브라우저가 막던 요청을 서버 경로로 옮겼습니다.</figcaption>
      </figure>
    </section>

    <section id="image-upload" className="project-detail-chapter">
      <header>
        <p>03 / Image upload</p>
        <h2>본문을 그대로 전달하다</h2>
      </header>
      <div className="project-detail-prose">
        <p>프록시가 multipart 요청을 req.body로 다시 만들면서 boundary와 본문이 어긋났습니다. 백엔드는 파일을 읽지 못하고 500을 반환했습니다.</p>
        <p>원본 요청 스트림을 fetch body로 직접 전달하고 duplex 옵션을 적용했습니다. 이미지 데이터가 프록시를 지나도 훼손되지 않게 했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-query">
        <div className="project-query-values" aria-hidden="true">
          <span>Before</span><b>req.body 재전송</b>
          <span>After</span><b>원본 request stream</b>
          <span>Result</span><b>multipart 형식 보존</b>
        </div>
        <code>fetch(apiUrl, &#123; body: req, duplex: &quot;half&quot; &#125;)</code>
        <figcaption>프록시 구간에서 깨지던 커뮤니티 이미지 업로드를 복구했습니다.</figcaption>
      </figure>
    </section>

    <section id="language-state" className="project-detail-chapter">
      <header>
        <p>04 / Language state</p>
        <h2>선택한 언어로 다시 받기</h2>
      </header>
      <div className="project-detail-prose">
        <p>UI 언어를 바꿔도 서버 데이터는 이전 언어로 남을 수 있었습니다. 화면과 축제 정보가 서로 다른 언어를 쓰는 문제였습니다.</p>
        <p>Zustand의 언어 상태를 i18next, API lang 파라미터, queryKey에 연결했습니다. 언어가 바뀌면 해당 언어의 데이터를 다시 요청합니다.</p>
      </div>
      <figure className="project-evidence project-evidence-query">
        <div className="project-query-values" aria-hidden="true">
          <span>State</span><b>Zustand language</b>
          <span>UI</span><b>i18next</b>
          <span>Data</span><b>lang + queryKey</b>
        </div>
        <code>[&quot;festivals&quot;, language, filters]</code>
        <figcaption>목록·검색·상세 화면의 문구와 서버 데이터가 같은 언어를 따릅니다.</figcaption>
      </figure>
    </section>
  </ProjectDetail>
);
