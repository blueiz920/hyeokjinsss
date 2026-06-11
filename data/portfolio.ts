import type { PortfolioData } from "./types";

export const portfolio: PortfolioData = {
  name: "Hyeokjin",
  title: "프론트엔드 개발자",
  introEyebrow: "문제를 파고들어 사용자 경험을 개선해요",
  introHeadline: "몰입감 있는 인터랙션을 설계해요.",
  introSubhead:
    "Next.js와 TypeScript로 검색 UX, 렌더링 성능, 배포 흐름처럼 사용 중 드러나는 문제를 코드로 정리해 왔습니다. 기획부터 구현, 배포와 QA까지 서비스 한 사이클을 경험하며 팀원이 검증과 개선에 집중할 수 있는 흐름을 만들었습니다.",
  introHighlights: [
    "검색 페이지 LCP 1.5s → 0.8s 개선",
    "URL 상태 동기화 43개 테스트 구축",
    "GitHub Actions·Vercel 배포 흐름 구성",
  ],
  nav: [
    { id: "intro", label: "Intro" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ],
  projects: [
    {
      slug: "moum-zip",
      title: "모음.zip",
      summary:
        "스터디·프로젝트 모임을 검색하고 운영하는 플랫폼. 검색 상태, SEO, 활동 시각화 흐름을 맡았습니다.",
      role: "Frontend 25%",
      impact:
        "LCP 1.5s→0.8s · URL 상태 동기화 43개 테스트 · 동적 sitemap/잔디 캐싱",
      stack: [
        "Next.js",
        "React",
        "TypeScript",
        "TailwindCSS",
        "TanStack Query",
        "Vitest",
        "Biome",
        "Husky",
      ],
      thumbnail: "/moum.zip.svg",
      links: [
        { label: "Live", href: "https://moum-zip-web.vercel.app/" },
        { label: "GitHub", href: "https://github.com/sprint-13/moum-zip" },
      ],
    },
    {
      slug: "k-festival",
      title: "K-Festival",
      summary:
        "외국인 관광객을 위한 한국 축제 탐색·커뮤니티 플랫폼. 온보딩과 전국/기간별 축제 화면, 배포 이슈를 맡았습니다.",
      role: "Frontend 80%",
      impact:
        "N+1 상세 호출 제거 · Mixed Content 프록시 해결 · multipart 업로드 500 안정화",
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
      links: [
        { label: "Live", href: "https://2025-unithon-team-4-fe.vercel.app/" },
        {
          label: "GitHub",
          href: "https://github.com/Unithon-INU/2025_UNITHON_TEAM_4_FE",
        },
      ],
    },
    {
      slug: "yajoba",
      title: "Yajoba",
      summary:
        "교내 물품 대여·전자계약 서비스. 계약서 작성 흐름과 WebSocket 채팅 기능을 맡았습니다.",
      role: "Frontend 50%",
      impact:
        "Optimistic UI 중복 메시지 방지 · 예약-계약 데이터 기준 정리 · 계약서 캡처/업로드 구현",
      stack: [
        "React",
        "TypeScript",
        "TailwindCSS",
        "Zustand",
        "React Query",
        "STOMP WebSocket",
        "html2canvas",
        "react-signature-canvas",
        "Axios",
      ],
      thumbnail: "/yajoba.svg",
      links: [
        { label: "Live", href: "https://yajoba-frontend.vercel.app/" },
        { label: "GitHub", href: "https://github.com/Team-GulBi/Frontend" },
      ],
    },
  ],
  skills: [
    {
      title: "React",
      problem: "검색·채팅·계약서처럼 흐름이 긴 화면을 기능별로 나눠야 했습니다.",
      approach:
        "화면을 컴포넌트 단위로 쪼개고, 상태와 API 호출 위치를 분리했습니다.",
      result:
        "수정 범위가 작아져 QA 피드백을 빠르게 반영할 수 있었습니다.",
    },
    {
      title: "TypeScript",
      problem: "API 응답과 UI 상태 기준이 흐려지면 작은 변경도 오류로 이어졌습니다.",
      approach:
        "응답 DTO, props, 이벤트 타입을 명확히 두고 흐름별 기준을 맞췄습니다.",
      result:
        "채팅·계약서·검색 기능의 리팩토링 부담을 줄였습니다.",
    },
    {
      title: "Tailwind CSS",
      problem: "반응형 화면을 빠르게 만들면서도 스타일 기준이 흩어지지 않아야 했습니다.",
      approach:
        "유틸리티 클래스로 레이아웃을 잡고, 반복되는 패턴은 공통 레이어로 정리했습니다.",
      result:
        "모바일부터 데스크탑까지 화면 수정 속도를 높였습니다.",
    },
    {
      title: "Next.js",
      problem: "검색 페이지 첫 화면과 SEO 경로가 데이터 대기 때문에 늦어질 수 있었습니다.",
      approach:
        "히어로와 데이터 영역을 분리하고, 동적 sitemap으로 상세 URL을 수집했습니다.",
      result:
        "LCP를 1.5s에서 0.8s로 줄이고 크롤링 경로를 넓혔습니다.",
    },
    {
      title: "Framer Motion / GSAP",
      problem: "인터랙션은 강하게 보여도 콘텐츠 읽기를 방해하면 안 됐습니다.",
      approach:
        "섹션별 모션을 분리하고, 스크롤·카드 전환 타이밍을 따로 조정했습니다.",
      result:
        "배경과 카드가 함께 살아나되 텍스트 가독성은 유지했습니다.",
    },
    {
      title: "Lenis",
      problem: "스크롤 기반 섹션에서 기기별 감도 차이가 크게 느껴졌습니다.",
      approach:
        "Lenis 스크롤러를 기준으로 ScrollTrigger scrollerProxy를 통합하고, wheelMultiplier/lerp로 체감을 조정했습니다.",
      result:
        "가로 전환과 배경 모션이 더 부드럽게 이어졌습니다.",
    },
    {
      title: "React Query / Zustand",
      problem: "서버 데이터와 언어·인증 같은 전역 상태가 섞이면 화면 기준이 흔들렸습니다.",
      approach:
        "API 데이터는 TanStack Query, UI·언어 상태는 Zustand로 나눴습니다.",
      result:
        "불필요한 요청을 줄이고 선택 언어와 데이터 표시 기준을 맞췄습니다.",
    },
    {
      title: "GitHub Actions / Vercel",
      problem: "반복 배포와 운영 환경 이슈가 기능 검증 시간을 잡아먹었습니다.",
      approach:
        "GitHub Actions와 Vercel 배포 흐름을 연결하고, 프록시로 HTTPS 요청 경로를 정리했습니다.",
      result:
        "배포 확인 시간을 줄이고 Mixed Content 문제를 해결했습니다.",
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
