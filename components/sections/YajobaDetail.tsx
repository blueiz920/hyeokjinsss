import { ProjectDetail, type DetailChapter } from "@/components/sections/ProjectDetail";
import type { Project } from "@/data/types";

type YajobaDetailProps = {
  project: Project;
};

const chapters: DetailChapter[] = [
  { id: "chat-message", index: "01", label: "메시지 정합성" },
  { id: "rental-flow", index: "02", label: "예약·계약 흐름" },
  { id: "contract-file", index: "03", label: "계약서 파일" },
];

export const YajobaDetail = ({ project }: YajobaDetailProps) => (
  <ProjectDetail
    project={project}
    caseIndex="03"
    eyebrow="Rental service"
    summary="두 번 보이던 메시지를 하나로 맞췄습니다. 예약 정보는 계약서와 신청까지 이어지게 했습니다."
    context="교내 물품 대여·전자계약 서비스입니다. 계약서 작성과 인증 상태, WebSocket 채팅을 맡았습니다."
    period="2024.11 — 2025.09"
    focus="WebSocket · Contract · Upload"
    coverAlt="Yajoba 물품 대여 화면"
    coverCaption="교내 물품 예약과 전자계약을 이어 주는 대여 서비스"
    chapters={chapters}
    lead="빠르게 보이는 것만으로는 부족했습니다. 화면에 먼저 그린 결과와 서버 응답이 어긋나지 않아야 했습니다."
    outcomeTitle={<>메시지는 하나로,<br />예약 정보는 끝까지.</>}
    outcomeBody="채팅의 임시 상태와 예약·계약 데이터를 하나의 기준으로 맞춰, 빠른 반응과 정확한 결과를 함께 지켰습니다."
    nextHref="/projects/moum-zip"
    nextTitle="모음.zip"
  >
    <section id="chat-message" className="project-detail-chapter">
      <header>
        <p>01 / Chat message</p>
        <h2>빠른 말풍선을 한 번만</h2>
      </header>
      <div className="project-detail-prose">
        <p>메시지를 보내자마자 pending 말풍선을 그렸지만, 서버 응답에 clientMessageId가 없었습니다. 확정 메시지가 도착하면 같은 내용이 한 번 더 보였습니다.</p>
        <p>채팅방, 송신자, 내용, 시간을 함께 비교해 같은 메시지를 찾았습니다. 새 말풍선을 추가하지 않고 기존 pending 상태를 확정 상태로 바꿨습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-performance">
        <div className="project-evidence-heading">
          <p>Visible message bubbles</p>
          <strong>2 → 1</strong>
        </div>
        <div className="project-render-paths" aria-label="낙관적 메시지 처리 변경 전후">
          <div>
            <span>Before</span>
            <ol><li>Pending bubble</li><li>Server bubble</li><li>Duplicate</li></ol>
          </div>
          <div>
            <span>After</span>
            <ol><li>Pending bubble</li><li>Match response</li><li>Confirm in place</li></ol>
          </div>
        </div>
        <figcaption>전송 직후의 반응성은 유지하고 중복 렌더링은 없앴습니다.</figcaption>
      </figure>
    </section>

    <section id="rental-flow" className="project-detail-chapter">
      <header>
        <p>02 / Rental flow</p>
        <h2>예약 정보를 끝까지</h2>
      </header>
      <div className="project-detail-prose">
        <p>예약 모달과 계약서 화면이 나뉘어 있어 선택한 물품과 대여 시간이 신청 단계까지 이어지지 않았습니다.</p>
        <p>productId 라우팅과 대여 시간 데이터를 연결했습니다. 예약, 계약 동의, 신청이 같은 예약 정보를 기준으로 움직이게 했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="예약부터 신청까지의 데이터 흐름">
          <li><span>01</span>Select product</li>
          <li><span>02</span>Rental time</li>
          <li><span>03</span>Contract</li>
          <li><span>04</span>Application</li>
        </ol>
        <figcaption>화면이 바뀌어도 같은 물품과 시간이 신청까지 이어집니다.</figcaption>
      </figure>
    </section>

    <section id="contract-file" className="project-detail-chapter">
      <header>
        <p>03 / Contract file</p>
        <h2>화면을 계약서 파일로</h2>
      </header>
      <div className="project-detail-prose">
        <p>승인 API는 서명이 포함된 계약서를 파일로 요구했습니다. 브라우저에 보이는 계약서 전체를 이미지로 만들어야 했습니다.</p>
        <p>외부 서명 이미지를 Blob과 Object URL로 바꿔 캡처에 포함했습니다. html2canvas로 만든 Blob을 multipart 요청에 담아 승인과 저장을 연결했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="계약서 파일 생성 과정">
          <li><span>01</span>Signature blob</li>
          <li><span>02</span>Contract DOM</li>
          <li><span>03</span>html2canvas</li>
          <li><span>04</span>Multipart upload</li>
        </ol>
        <figcaption>서명이 포함된 화면을 파일로 만들어 계약 승인 API에 전달했습니다.</figcaption>
      </figure>
    </section>
  </ProjectDetail>
);
