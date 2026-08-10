import type { PortfolioData } from "./types";

export const portfolio: PortfolioData = {
  name: "Hyeokjin",
  title: "프론트엔드 개발자",
  introEyebrow: "Hyeokjin Kwon",
  introHeadline: {
    accent: "Frontend",
    rest: "Developer",
  },
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
      title: "Product UI",
      tools: ["React", "TypeScript", "Tailwind CSS"],
      summary:
        "검색·계약·온보딩처럼 단계가 긴 화면을 사용자가 다음 행동을 자연스럽게 이해하도록 설계합니다.",
      project: "모음.zip · K-Festival · Yajoba",
      evidence: "기능 단위 컴포넌트 분리로 QA 피드백 반영 범위를 작게 유지했습니다.",
    },
    {
      title: "Data & State",
      tools: ["TanStack Query", "Zustand", "STOMP WebSocket"],
      summary:
        "서버 데이터와 화면 상태의 책임을 나눠, 화면마다 다른 기준으로 흔들리지 않게 만듭니다.",
      project: "K-Festival · Yajoba",
      evidence: "언어·인증 상태와 API 데이터를 분리해 중복 요청과 표시 기준의 충돌을 줄였습니다.",
    },
    {
      title: "Performance & SEO",
      tools: ["Next.js", "Rendering", "Sitemap"],
      summary:
        "첫 화면의 체감 속도와 검색 엔진이 읽는 경로를 함께 점검해 발견 가능한 서비스를 만듭니다.",
      project: "모음.zip",
      evidence: "검색 페이지 LCP를 1.5s에서 0.8s로 개선하고 동적 sitemap을 구성했습니다.",
    },
    {
      title: "Motion & Interaction",
      tools: ["Framer Motion", "GSAP", "Lenis"],
      summary:
        "정보의 우선순위를 해치지 않는 범위에서 전환과 피드백을 설계해 흐름을 선명하게 만듭니다.",
      project: "개인 포트폴리오",
      evidence: "섹션별 모션과 스크롤 감도를 분리해 텍스트 가독성을 유지했습니다.",
    },
    {
      title: "Delivery & Reliability",
      tools: ["Vitest", "GitHub Actions", "Vercel"],
      summary:
        "기능 완성 뒤에도 재현 가능한 검증과 배포 흐름을 만들어 팀의 개선 속도를 지킵니다.",
      project: "모음.zip · K-Festival",
      evidence: "URL 상태 동기화 43개 테스트와 HTTPS 프록시로 배포 이슈를 안정화했습니다.",
    },
  ],
  contactEmail: "rnjsgurwls123@naver.com",
  socials: [
    { label: "GitHub", href: "https://github.com/blueiz920" },
    { label: "Email", href: "mailto:rnjsgurwls123@naver.com" },
  ],
};
