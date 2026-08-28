import {
  ProjectChapter,
  type DetailChapter,
} from "@/components/sections/ProjectChapter";
import {
  ProjectDetail,
  type DetailOrder,
} from "@/components/sections/ProjectDetail";
import type { Project } from "@/data/types";

type YajobaDetailProps = {
  project: Project;
  order: DetailOrder;
};

const chapterByKey = {
  chatMessage: { id: "chat-message", index: "01", label: "메시지 중복" },
  rentalFlow: { id: "rental-flow", index: "02", label: "예약·계약 흐름" },
  contractFile: { id: "contract-file", index: "03", label: "계약서 파일" },
} satisfies Record<string, DetailChapter>;

const chapters = Object.values(chapterByKey);

export const YajobaDetail = ({ project, order }: YajobaDetailProps) => (
  <ProjectDetail
    project={project}
    order={order}
    eyebrow="Rental service"
    summary="전자계약 · 인증 상태 · WebSocket 채팅 · 계약서 파일 처리"
    context="교내 물품 대여·전자계약 서비스입니다. 계약서 작성과 인증 상태, WebSocket 채팅을 맡았습니다."
    period="2024.11 — 2025.09"
    focus="Contract · Auth · Chat"
    coverAlt="Yajoba 물품 대여 화면"
    coverCaption="교내 물품 예약과 전자계약을 이어 주는 대여 서비스"
    chapters={chapters}
    lead="계약서 페이지와 WebSocket 채팅의 데이터 기준을 정리했습니다."
    outcomeTitle={<>메시지 중복 방지와<br />계약 데이터 연결.</>}
    outcomeBody="pending 메시지는 서버 응답과 합쳤습니다. 물품과 대여 시간은 계약서 파일, 신청, 승인 API까지 같은 예약 정보로 이어집니다."
  >
    <ProjectChapter
      chapter={chapterByKey.chatMessage}
      kicker="Chat message"
      title="낙관적 UI 유지와 메시지 중복 방지"
    >
      <div className="project-detail-prose">
        <p>메시지를 보내자마자 pending 말풍선을 그렸지만, 서버 응답에 clientMessageId가 없었습니다. 확정 메시지가 도착하면 같은 내용이 한 번 더 보였습니다.</p>
        <p>낙관적 UI는 유지하고 채팅방·송신자·내용·시간을 함께 비교해 같은 메시지를 찾았습니다. 서버 응답이 오면 새 말풍선을 추가하지 않고 기존 pending 상태를 확정했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-performance">
        <div className="project-evidence-heading">
          <p>화면에 보이는 메시지</p>
          <strong>2 → 1</strong>
        </div>
        <div className="project-render-paths" aria-label="낙관적 메시지 처리 변경 전후">
          <div>
            <span>Before</span>
            <ol><li>임시 말풍선</li><li>서버 말풍선</li><li>중복 표시</li></ol>
          </div>
          <div>
            <span>After</span>
            <ol><li>임시 말풍선</li><li>응답 비교</li><li>기존 말풍선 확정</li></ol>
          </div>
        </div>
        <figcaption>clientMessageId가 없는 응답에서도 말풍선은 2개가 아닌 1개로 남습니다.</figcaption>
      </figure>
    </ProjectChapter>

    <ProjectChapter
      chapter={chapterByKey.rentalFlow}
      kicker="Rental flow"
      title="productId 기반 예약·계약 데이터 연결"
    >
      <div className="project-detail-prose">
        <p>예약 모달과 계약서 화면이 나뉘어 있어 선택한 물품과 대여 시간이 신청 단계까지 이어지지 않았습니다.</p>
        <p>라우트의 productId와 대여 시간을 공통 기준으로 삼아 계약서 화면에 전달했습니다. 예약, 계약 동의, 신청이 같은 물품과 시간을 사용하도록 흐름을 제안하고 구현했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="예약부터 신청까지의 데이터 흐름">
          <li><span>01</span>물품 선택</li>
          <li><span>02</span>대여 시간</li>
          <li><span>03</span>계약서</li>
          <li><span>04</span>신청</li>
        </ol>
        <figcaption>화면이 바뀌어도 같은 물품과 시간이 신청까지 이어집니다.</figcaption>
      </figure>
    </ProjectChapter>

    <ProjectChapter
      chapter={chapterByKey.contractFile}
      kicker="Contract file"
      title="html2canvas 계약서 생성과 multipart 업로드"
    >
      <div className="project-detail-prose">
        <p>승인 API는 서명이 포함된 계약서를 파일로 요구했습니다. 브라우저에 보이는 계약서 전체를 이미지로 만들어야 했습니다.</p>
        <p>외부 서명 이미지는 Blob과 Object URL로 바꿔 계약서 DOM에 포함했습니다. html2canvas로 만든 결과를 다시 Blob으로 변환하고 multipart 요청에 담아 승인 API에 업로드했습니다.</p>
      </div>
      <figure className="project-evidence project-evidence-flow">
        <ol aria-label="계약서 파일 생성 과정">
          <li><span>01</span>서명 Blob</li>
          <li><span>02</span>계약서 DOM</li>
          <li><span>03</span>html2canvas</li>
          <li><span>04</span>multipart 업로드</li>
        </ol>
        <figcaption>서명이 포함된 화면을 파일로 만들어 계약 승인 API에 전달했습니다.</figcaption>
      </figure>
    </ProjectChapter>
  </ProjectDetail>
);
