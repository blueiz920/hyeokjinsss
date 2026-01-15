import type { PortfolioData } from "./types";

export const portfolio: PortfolioData = {
  name: "Hyeokjin",
  title: "프론트엔드 개발자",
  introEyebrow: "문제를 파고들어 사용자 경험을 개선해요",
  introHeadline: "몰입감 있는 인터랙션을 설계해요.",
  introSubhead:
    "React/TypeScript 기반으로 상태와 데이터들을 다루고, 유지보수 가능한 구조 설계를 지향합니다. 팀원과의 소통을 중심으로 UX와 DX, 모두 촘촘히 가져가며 팀의 성과를 끌어올리기 위해 노력합니다.",
  introHighlights: [
    "React + TypeScript로 UI/UX 안정화",
    "React Query·Zustand로 복잡한 상태 관리",
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
        "다국어 기반으로 한국 축제 정보를 탐색할 수 있는 웹 플랫폼. 온보딩/축제리스트 페이지를 중심으로 UX, 데이터 흐름 설계 및 정리",
      role: "Frontend 80%",
      impact:
        "전반적 API 연동 · 무한스크롤 구현 · GA->Vercel 자동배포 파이프라인 구축",
      stack: [
        "React",
        "TypeScript",
        "TailwindCSS",
        "Zustand",
        "i18next",
        "React Query",
        "Framer Motion",
        "Vercel",
        "GitHub Actions",
        "Axios",
      ],
      thumbnail: "/k-festival.svg",
      links: [{ label: "GitHub", href: "https://github.com/blueiz920/2025_UNITHON_TEAM_4_FE" }],
    },
    {
      slug: "yajoba",
      title: "Yajoba",
      summary:
        "공유경제 대여/반납 서비스. 대여 후 계약서 생성 시스템과 웹소켓 기반 채팅기능 구현",
      role: "Frontend 50%",
      impact:
        "채팅 메시지 중복/순서 꼬임 개선 · 계약서 동적 라우팅 설계 및 재구축 · 전자서명 오버레이 캡처",
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
      thumbnail: "/yajoba.svg",
      links: [{ label: "GitHub", href: "https://github.com/Team-GulBi/Frontend" }],
    },
    {
      slug: "portfolio-site",
      title: "HYEOKJIN (Portfolio)",
      summary:
        "개인 포트폴리오. 스크롤 기반 인터랙션은 UX를 해치지 않는 범위에서 구성",
      role: "Frontend 100%",
      impact: "SSR/SEO를 고려한 구조 설계 · Pin 카드 전환 step/hold 안정화 · 스크롤 진행 인디케이터로 UX 개선",
      stack: ["Next.js", 
        "TypeScript", 
        "TailwindCSS", 
        "Framer Motion", 
        "Vercel",
        "Lenis",
      ],
      thumbnail: "/example.svg",
      links: [{ label: "GitHub", href: "https://github.com/blueiz920/hyeokjinsss" }],
    },
  ],
    skills: [
    {
      title: "React",
      problem: "프론트엔드 핵심 UI 프레임워크로 사용했습니다.",
      approach:
        "컴포넌트 단위로 화면을 분리하고, 재사용 가능한 섹션/레이아웃 구조로 구성했습니다.",
      result:
        "페이지 확장(섹션 추가/수정)과 유지보수가 쉬운 구조로 정리했습니다.",
    },
    {
      title: "TypeScript",
      problem: "안정적인 타입 기반 개발을 위해 사용했습니다.",
      approach:
        "API/상태/컴포넌트 props에 타입을 적용하고, 이벤트/콜백 시그니처를 명확히 관리했습니다.",
      result:
        "런타임 오류를 줄이고, 리팩토링 시 안정성을 높였습니다.",
    },
    {
      title: "Tailwind CSS",
      problem: "빠른 UI 구현과 일관된 스타일링을 위해 사용했습니다.",
      approach:
        "유틸리티 클래스 기반으로 레이아웃을 구성하고, 공통 스타일은 globals.css의 컴포넌트 레이어로 정리했습니다.",
      result:
        "스타일 중복을 줄이고, 반응형 UI를 빠르게 적용했습니다.",
    },
    {
      title: "Next.js",
      problem: "라우팅/번들링/SSR 기반 웹 포트폴리오를 위해 사용했습니다.",
      approach:
        "App Router로 페이지를 구성하고, 메타데이터와 레이아웃 구조를 정리해 SSR/SEO를 고려했습니다.",
      result:
        "초기 렌더링 품질과 검색 노출(SEO) 기반이 안정화되고, 전체 구조와 배포 흐름이 단순해졌습니다.",
    },
    {
      title: "Framer Motion / GSAP",
      problem: "다양한 인터랙션과 전환 애니메이션을 위해 사용했습니다.",
      approach:
        "섹션 단위 모션 규칙을 정하고, UX를 고려하며 적절히 적용했습니다.",
      result:
        "다양한 서비스, 웹 플랫폼의 디자인에 사용했습니다.",
    },
    {
      title: "Lenis",
      problem: "스크롤 감도/관성 제어를 위해 사용했습니다.",
      approach:
        "Lenis 스크롤러를 기준으로 ScrollTrigger scrollerProxy를 통합하고, wheelMultiplier/lerp로 체감을 조정했습니다.",
      result:
        "디바이스별 스크롤 편차를 줄이고, 스크롤 경험을 부드럽게 만들었습니다.",
    },
    {
      title: "React Query / Zustand",
      problem: "서버 데이터와 전역 상태 관리를 위해 사용했습니다.",
      approach:
        "서버 데이터는 React Query로 패칭/캐싱하고, 세션/전역 UI 상태는 Zustand로 분리해 관리했습니다.",
      result:
        "복잡한 데이터의 흐름을 효율적으로 다루고, 일관적인 상태관리에 도움을 주었습니다.",
    },
    {
      title: "GitHub Actions / Vercel",
      problem: "배포 자동화와 운영 효율을 위해 사용했습니다.",
      approach:
        "빌드/검증 후 배포되는 흐름을 구성하고, 배포 환경에서 빠르게 확인할 수 있도록 정리했습니다.",
      result:
        "반복 배포 작업을 줄이고, 릴리즈 속도를 높였습니다.",
    },
],

  // skillsSummary:
  //   "UX를 먼저 세우고, 성능·접근성·유지보수성 기준을 지키는 범위에서 인터랙션을 더합니다.",
  contactEmail: "rnjsgurwls123@naver.com",
  socials: [
    { label: "GitHub", href: "https://github.com/blueiz920" },
    { label: "Email", href: "mailto:rnjsgurwls123@naver.com" },
  ],
};
