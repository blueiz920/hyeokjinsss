# Performance Budget

- Max pinned sections: 2 (Project Reveal + Skills Horizontal).
- Pinned sections should rely on `transform` + `opacity` only.
- Avoid filters, heavy blur, or large box-shadows inside scroll-tied regions.
- Target < 200ms total blocking time on mid-tier hardware.
- Keep hero media lightweight; no autoplay video in pinned segments.
