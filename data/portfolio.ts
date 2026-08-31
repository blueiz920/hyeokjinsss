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
      ogImage: "/og/projects/moum-zip.png",
      links: [
        {
          kind: "live",
          label: "Live",
          href: "https://moum-zip-web.vercel.app/",
        },
        {
          kind: "github",
          label: "GitHub",
          href: "https://github.com/sprint-13/moum-zip",
        },
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
      ogImage: "/og/projects/k-festival.png",
      links: [
        {
          kind: "live",
          label: "Live",
          href: "https://2025-unithon-team-4-fe.vercel.app/",
        },
        {
          kind: "github",
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
      ogImage: "/og/projects/yajoba.png",
      links: [
        {
          kind: "live",
          label: "Live",
          href: "https://yajoba-frontend.vercel.app/",
        },
        {
          kind: "github",
          label: "GitHub",
          href: "https://github.com/Team-GulBi/Frontend",
        },
      ],
    },
  ],
  skills: [
    {
      title: "UI Engineering",
      tools: ["React", "TypeScript", "Tailwind CSS"],
      summary:
        "React와 TypeScript로 검색, 온보딩, 전자계약 화면을 기능 단위 컴포넌트로 구현했습니다.",
      projects: [
        { slug: "moum-zip" },
        { slug: "k-festival" },
        { slug: "yajoba" },
      ],
      evidence: "공통 UI와 기능별 상태를 분리해 QA 수정 범위를 좁혔습니다.",
    },
    {
      title: "Data & State",
      tools: ["TanStack Query", "Zustand", "STOMP WebSocket"],
      summary:
        "TanStack Query로 서버 데이터를 관리하고 Zustand로 언어·인증·화면 상태를 분리했습니다.",
      projects: [
        { slug: "moum-zip" },
        { slug: "k-festival" },
        { slug: "yajoba" },
      ],
      evidence: "K-Festival의 다국어 queryKey와 Yajoba의 예약·계약 데이터를 같은 기준으로 연결했습니다.",
    },
    {
      title: "Performance & SEO",
      tools: ["Next.js", "Rendering", "Sitemap"],
      summary:
        "Next.js SSR 렌더링 경로를 조정하고 검색 페이지와 동적 상세 페이지의 SEO를 구성했습니다.",
      projects: [{ slug: "moum-zip" }],
      evidence: "검색 페이지 LCP 1.5s→0.8s, 동적 sitemap, 활동 데이터 캐싱을 구현했습니다.",
    },
    {
      title: "Motion & Interaction",
      tools: ["Framer Motion", "GSAP", "Lenis"],
      summary:
        "Framer Motion과 GSAP으로 화면 전환과 피드백을 만들고 Lenis로 스크롤 동작을 조율했습니다.",
      projects: [
        { label: "개인 포트폴리오" },
        { slug: "k-festival" },
      ],
      evidence: "프로젝트 미리보기, 섹션 전환, 내비게이션 모션과 reduced-motion 대응을 구현했습니다.",
    },
    {
      title: "Testing & Delivery",
      tools: ["Vitest", "GitHub Actions", "Vercel"],
      summary:
        "Vitest로 상태 로직을 검증하고 GitHub Actions와 Vercel로 배포 흐름을 구성했습니다.",
      projects: [
        { slug: "moum-zip" },
        { slug: "k-festival" },
      ],
      evidence: "URL 상태 동기화 43개 케이스를 고정하고 K-Festival의 HTTPS 배포 경로를 복구했습니다.",
    },
  ],
  contactEmail: "rnjsgurwls123@naver.com",
  socials: [
    {
      kind: "github",
      label: "GitHub",
      href: "https://github.com/blueiz920",
    },
    {
      kind: "email",
      label: "Email",
      href: "mailto:rnjsgurwls123@naver.com",
    },
  ],
};
