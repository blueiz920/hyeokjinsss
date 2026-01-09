import type { PortfolioData } from "./types";

export const portfolio: PortfolioData = {
  name: "Hyeokjin",
  title: "프론트엔드 개발자",
  introEyebrow: "문제를 파고들어 사용자 경험을 개선합니다",
  introHeadline: "몰입감 있는 인터랙션을 설계합니다.",
  introSubhead:
    "React/TypeScript 기반으로 상태와 서버 데이터를 정리하고, 유지보수 가능한 구조로 빠르게 전달합니다. 협업에서는 이슈·PR 중심으로 피드백을 촘촘히 가져가며 팀의 속도를 끌어올립니다.",
  introHighlights: [
    "React + TypeScript로 UI/상태 안정화",
    "React Query·Zustand로 복잡한 흐름을 예측 가능하게",
    "GitHub Actions → Vercel 배포 자동화 경험",
  ],
  nav: [
    { id: "intro", label: "Intro" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ],
  projects: [
    {
      slug: "k-festival",
      title: "K-Festival",
      summary:
        "다국어 기반으로 한국 축제 정보를 탐색할 수 있는 웹 플랫폼. 온보딩/검색/리스트 경험을 중심으로 UI와 데이터 흐름을 정리했습니다.",
      role: "Frontend 80%",
      impact:
        "첫 렌더링 깜빡임 해결 · 무한스크롤 구현 · 이미지 업로드 지연/실패 개선",
      stack: [
        "React",
        "TypeScript",
        "TailwindCSS",
        "i18next",
        "React Query",
        "Framer Motion",
        "Vercel",
        "GitHub Actions",
      ],
      thumbnail: "/example.svg",
      links: [{ label: "GitHub", href: "https://github.com/blueiz920" }],
    },
    {
      slug: "yajoba",
      title: "Yajoba",
      summary:
        "공유경제 대여/반납 서비스. 대여 예약→계약→승인→캡처 업로드까지의 흐름과, 웹소켓 기반 채팅의 안정성을 함께 개선했습니다.",
      role: "Frontend 50%",
      impact:
        "채팅 메시지 중복/순서 꼬임 개선 · 예약/계약 라우팅 흐름 재구축 · 전자서명 오버레이 캡처 구현",
      stack: [
        "React",
        "TypeScript",
        "TailwindCSS",
        "Zustand",
        "React Query",
        "WebSocket",
        "html2canvas",
        "Axios",
      ],
      thumbnail: "/example.svg",
      links: [{ label: "GitHub", href: "https://github.com/blueiz920" }],
    },
    {
      slug: "portfolio-site",
      title: "개인 포트폴리오 사이트 (Next.js)",
      summary:
        "한 페이지 스크롤 내에서 ‘프로젝트 맥락 → 의사결정 → 결과’가 빠르게 전달되도록 구성한 개인 포트폴리오. 모션은 성능 예산을 기준으로 설계했습니다.",
      role: "Frontend 100%",
      impact: "SSR/SEO를 고려한 구조 설계 · 인터랙션은 성능/접근성 기준으로 절제",
      stack: ["Next.js", "TypeScript", "TailwindCSS", "Framer Motion", "Vercel"],
      thumbnail: "/example.svg",
      links: [{ label: "GitHub", href: "https://github.com/blueiz920" }],
    },
  ],
  skills: [
    {
      title: "상태·서버데이터 분리",
      problem: "화면이 복잡해질수록 로딩/에러/동기화가 뒤엉켜 유지보수가 어려워집니다.",
      approach:
        "서버 데이터는 React Query로, 전역 UI/세션 성격의 값은 Zustand로 분리해 책임을 명확히 합니다.",
      result: "로딩/에러/갱신 흐름이 예측 가능해지고 디버깅 비용이 줄어듭니다.",
    },
    {
      title: "배포 자동화",
      problem: "수동 배포는 누락과 버전 혼선을 만들고, 팀 속도를 떨어뜨립니다.",
      approach:
        "특정 브랜치 머지 시 GitHub Actions로 빌드/검증 후 Vercel로 배포되는 파이프라인을 구성합니다.",
      result: "반복 작업을 줄이고, 더 빠르게 안정적인 릴리즈가 가능합니다.",
    },
    {
      title: "온보딩 모션 품질",
      problem: "첫 렌더링에서 애니메이션이 어색하면 제품 신뢰도가 즉시 떨어집니다.",
      approach:
        "초기 상태(예: 계절 테마) 전환을 고려해 prevSeason 같은 보조 상태를 두고, 모션 규칙을 일관되게 적용합니다.",
      result: "첫 진입부터 자연스러운 전환으로 몰입감을 유지합니다.",
    },
    {
      title: "대용량 이미지 업로드 개선",
      problem: "파일 업로드는 네트워크/서버 제약에 의해 지연·실패가 쉽게 발생합니다.",
      approach:
        "서버 제약(예: 1MB 제한)을 원인으로 확인한 뒤, imageCompression 등으로 전송 바이트를 줄입니다.",
      result: "업로드 성공률을 높이고, 사용자가 체감하는 대기 시간을 줄입니다.",
    },
    {
      title: "실시간 채팅 안정화",
      problem: "온라인/오프라인 전달 방식 차이로 메시지 중복 노출과 순서 꼬임이 생길 수 있습니다.",
      approach:
        "클라이언트에서 메시지 id를 부여해 중복을 제거하고, WS 연결은 1회 유지 + 방 단위 구독 전환으로 규칙을 고정합니다. 과거 메시지는 REST로 받고 WS 수신과 병합하며, 낙관적 UI로 전송 경험을 개선합니다.",
      result: "일관된 타임라인과 빠른 체감 속도로 채팅 사용성이 안정됩니다.",
    },
    {
      title: "UX와 DX의 균형",
      problem: "흐름이 분리되면 라우팅/파라미터/하드코딩이 늘어 개발 속도가 떨어집니다.",
      approach:
        "예약→계약 같은 사용자 흐름을 단일 시나리오로 연결하고, 라우팅 규칙과 컴포넌트 구조를 정리합니다.",
      result: "기능 추가/수정이 쉬워지고, 팀 내 커뮤니케이션 비용이 줄어듭니다.",
    },
  ],
  skillsSummary:
    "UX를 먼저 세우고, 성능·접근성·유지보수성 기준을 지키는 범위에서 인터랙션을 더합니다.",
  contactEmail: "rnjsgurwls123@inu.ac.kr",
  socials: [
    { label: "GitHub", href: "https://github.com/blueiz920" },
    { label: "Email", href: "mailto:rnjsgurwls123@inu.ac.kr" },
  ],
};
