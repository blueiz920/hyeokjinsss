# hyeokjinsss

권혁진 개인 포트폴리오 사이트입니다. Next.js App Router 기반으로 구성했고, 스크롤 중심의 인터랙션과 프로젝트/기술 경험 소개를 담고 있습니다.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- GSAP / ScrollTrigger
- Framer Motion
- Lenis
- Yarn 4

## Getting Started

이 저장소는 전역 Yarn 설치 없이 레포에 포함된 Yarn 4를 사용합니다.

```bash
yarn install
yarn dev
```

로컬 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

현재 셸에서 `yarn` 명령이 인식되지 않으면 아래처럼 레포에 포함된 Yarn 파일을 직접 실행할 수 있습니다.

```bash
node ./.yarn/releases/yarn-4.12.0.cjs install
node ./.yarn/releases/yarn-4.12.0.cjs dev
```

## Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
```

## Project Structure

- `app/`: Next.js App Router entry, global layout, page composition
- `components/common/`: shared UI primitives and interaction controls
- `components/layout/`: header, footer, container, skip link
- `components/sections/`: portfolio sections
- `data/`: portfolio content and types
- `hooks/`: scroll runtime, section registry, reduced-motion handling
- `lib/animation/`: GSAP/ScrollTrigger animation setup
- `lib/motion/`: motion policy helpers
- `lib/perf/`: performance and motion guardrails
- `public/`: static assets

## Deployment Notes

- Production target: Vercel
- Metadata base: `https://hyeokjinsss.vercel.app`
- Vercel root directory should point to the repository root.

If a custom domain is added later, update `metadataBase` in `app/layout.tsx`.
