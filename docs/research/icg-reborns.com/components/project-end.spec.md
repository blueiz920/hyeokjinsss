# Project end component spec

## Overview

- Target: `components/sections/ProjectNext.tsx`
- Styles: `styles/project-detail.css`
- Source: `https://www.icg-reborns.com/en/projects/icgreborns-portfolio`
- Selector: `main > section.wrap .next-proj` plus `body > footer.footer`
- Screenshots: `.superloopy/evidence/website-clone/icg-reborns.com/source/icg-desktop-end.png`, `icg-mobile-end.png`, `icg-desktop-end-hover.png`
- Model: mixed static and hover-driven component.

## DOM Structure

Source:

```text
section.wrap
└─ div.next-proj
   ├─ div
   │  ├─ span.eyebrow "Next project"
   │  └─ a > span.lab + svg
   └─ a.btn.btn-ghost "Back to all work"
footer.footer.wrap
├─ div.footer__grid
│  ├─ p.footer__big
│  └─ two div.footer__col
└─ div.footer__bar
```

Local target keeps one semantic `footer.project-detail-next`, its existing curve, and creates: curve → shell → next-project row → divider → contact copy with a `Navigate` column and an `Elsewhere` column.

## Computed Styles

Desktop source values:

- `.next-proj`: `display:flex`, `justify-content:space-between`, `align-items:center`, `gap:24px`, `padding:64px 0`, `width:1096px`, `height:231.797px`.
- `.eyebrow`: `13px/20.8px`, `letter-spacing:1.82px`, muted `rgb(163 160 148)`.
- title link: `inline-flex`, `gap:18px`, `58px/92.8px`, weight `600`, tracking `-1.74px`, transition `gap .3s,color .3s`.
- all-work control: compact text link with a subtle bottom rule, small arrow cue, and a 44px minimum interaction height; it is intentionally lighter than the next-project title.
- footer: `64px 72px 32px`, top border `rgba(246 244 236 / 12%)`.
- footer grid: `grid`, `442.281px 294.859px 294.859px`, `32px` gap.
- statement: `44px/70.4px`, weight `600`, max-width `398.09px`.

Local values should use existing fluid sizing and tokens rather than importing the source fonts. Preserve the current large next-project scale and `project-detail-shell` measure.

## States and Behaviors

- Rest: cream next title and arrow on `--detail-ink`; the all-project control uses a quiet text treatment and bottom rule.
- Next hover/focus: amber highlight appears behind title, text turns ink, arrow shifts diagonally; `240–300ms` transition.
- All-project hover/focus: the rule and text move to the cream/accent contrast and the arrow shifts slightly; no route behavior change.
- Curve: existing `initFooterCurve` behavior remains unchanged.
- Reduced motion: no lift, arrow translation, or animated highlight transition; controls remain readable and focus-visible.

## Per-State Content

- Next label: `Next project`.
- Next project title/href remain props.
- Compact close: eyebrow `Contact`, heading `다음 경험을 함께 만들어요.`
- `Navigate` column: the same `Projects`, `Skills`, and `Contact` sections exposed by the home navigation, each routed through `TransitionLink`.
- `Elsewhere` column: `연락하기`, `GitHub`.

## Assets

No new assets or dependencies. Use the current arrow glyph, Pretendard, route-transition link, and portfolio data.

## Text Content

Use only the content listed above and existing `portfolio.contactEmail` / `portfolio.socials`. Do not copy the ICG identity, copyright, CV, or navigation copy.

## Responsive Behavior

- 1440px: next title and all-project control share a row; the close band uses contact, Navigate, and Elsewhere columns.
- 768px: the contact copy spans the first row while Navigate and Elsewhere share the second row; maintain 44px minimum targets.
- 390px: next controls stack, the compact all-project link stays content-sized, and contact, Navigate, and Elsewhere stack without horizontal overflow.
- The existing curve remains 10vh desktop and 5vh mobile.

## Original Implementation Inventory

- DOM and classes: listed under DOM Structure.
- CSS: static flex/grid layout; title hover highlight/gap; compact all-project rule/arrow cue; centered section-link dot cue; responsive single-column layout.
- JS/listeners/timers/masks: none for the source component.
- Layers: document-flow dividers only; no z-index layering.
- Assets: inline SVG arrow only.
- Libraries: no component-specific library detected.

## Parity Decision

`approved reimplementation`. The user explicitly asked to combine the ICG format with the existing `ProjectNext`, not copy it verbatim. A framework-adapted port would remove the existing curve and transition behaviors and import unrelated branding. We preserve the source information hierarchy and interactions while retaining this portfolio's curve, colors, typeface, copy, and route lifecycle.
