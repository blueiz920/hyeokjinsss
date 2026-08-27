# ICG Reborns project-end dependency graph

## Source

`main > section.wrap > .next-proj`

- `.eyebrow`: label and decorative leading rule
- `.next-proj > div > a`: next title, inline SVG, hover gap/highlight
- `.btn.btn-ghost`: all-work pill, border/translate hover

`body > footer.footer.wrap`

- `.footer__grid`: statement plus two link columns
- `.footer__bar`: bottom divider and metadata
- No JavaScript driver, event listener, timer, mask, asset, or third-party interaction library detected.

## Local

`ProjectDetail` → `ProjectNext`

- `TransitionLink`: next project and all-project route transitions
- `portfolio`: contact email and GitHub URL
- `useScrollRuntime`: reduced-motion preference
- `initFooterCurve`: existing scroll-driven cream-to-black curve
- `styles/project-detail.css`: all layout, responsive, hover, focus, and reduced-motion states

The adaptation intentionally retains the local curve driver and route-transition behavior instead of porting the source static wrapper.
