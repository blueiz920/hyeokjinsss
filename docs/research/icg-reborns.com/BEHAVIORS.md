# ICG Reborns project-end behaviors

## Sweep

- Scroll: inspected from the project body through the outcome, next-project row, and footer before interacting. The end section is not scroll-driven.
- Next-project hover: the title receives a yellow background (`rgb(255 200 20)`), dark text (`rgb(21 20 15)`), `4px` radius, and the link gap grows from `18px` to `28px` over `300ms`.
- All-work hover: border changes from `rgba(246 244 236 / 12%)` to `rgb(246 244 236)` and the pill translates `-2px` on Y. Transition is `250–350ms` with `cubic-bezier(.22,1,.36,1)`.
- Time: no autoplay or timed state in this component.
- Click: both controls are normal navigation links.

## Responsive sweep

- 1440px: next project and all-work pill share one horizontal row. Footer is a three-column grid.
- 768px: the same hierarchy is retained with reduced available measure.
- 390px: next controls stack, the all-work pill becomes full-width, and footer columns become one column.

## Local adaptation

Keep the existing next-project arrow motion and route-transition link. Add an amber title highlight on hover/focus, a compact all-project text link, and a compact contact band with `Navigate` and `Elsewhere` columns. The interaction must be absent under reduced motion while focus state remains visible.
