import { forwardRef } from "react";

type CircuitPath = {
  className: string;
  d: string;
  id: string;
  pathKey?: string;
};

type CircuitNode = {
  className?: string;
  cx: number;
  cy: number;
  r: number;
};

type DotTrain = {
  count: number;
  gap: number;
  height: number;
  width: number;
  x: number;
  y: number;
};

type Runner = {
  duration: number;
  offset: number;
  pathKey: string;
  r: number;
};

const desktopPaths: CircuitPath[] = [
  {
    id: "skills-d-top-main",
    pathKey: "top-main",
    className: "skills-bg__path skills-bg__path--primary",
    d: "M895 168 H1280 L1318 202 L1358 168 H1535 L1550 154 H1670",
  },
  {
    id: "skills-d-top-upper",
    pathKey: "top-upper",
    className: "skills-bg__path skills-bg__path--secondary",
    d: "M780 148 H1082 L1094 134 H1296 L1328 166 H1540",
  },
  {
    id: "skills-d-top-lower",
    pathKey: "top-lower",
    className: "skills-bg__path skills-bg__path--secondary",
    d: "M995 238 H1518 L1534 224 H1670",
  },
  {
    id: "skills-d-top-faint",
    className: "skills-bg__path skills-bg__path--atmospheric",
    d: "M990 202 H1520",
  },
  {
    id: "skills-d-bottom-main",
    pathKey: "bottom-main",
    className: "skills-bg__path skills-bg__path--primary",
    d: "M0 762 H492 L518 787 H912 L980 852 H1220 L1238 837 H1590 L1606 864 H1670",
  },
  {
    id: "skills-d-bottom-lower",
    pathKey: "bottom-lower",
    className: "skills-bg__path skills-bg__path--secondary",
    d: "M0 792 H176 L204 818 H895 L980 871 H1670",
  },
  {
    id: "skills-d-bottom-accent-left",
    className: "skills-bg__path skills-bg__path--secondary",
    d: "M230 835 H330",
  },
  {
    id: "skills-d-bottom-accent-right",
    className: "skills-bg__path skills-bg__path--atmospheric",
    d: "M940 818 H960 M1228 837 H1590",
  },
];

const desktopNodes: CircuitNode[] = [
  { cx: 895, cy: 168, r: 4.5, className: "skills-bg__node--hot" },
  { cx: 1094, cy: 134, r: 3.5 },
  { cx: 1296, cy: 134, r: 3.5 },
  { cx: 1535, cy: 168, r: 3.5 },
  { cx: 1224, cy: 238, r: 3.5, className: "skills-bg__node--hot" },
  { cx: 1574, cy: 224, r: 4 },
  { cx: 136, cy: 762, r: 3.5, className: "skills-bg__node--hot" },
  { cx: 895, cy: 818, r: 4, className: "skills-bg__node--hot" },
  { cx: 1238, cy: 837, r: 4 },
  { cx: 1364, cy: 852, r: 4.5, className: "skills-bg__node--hot" },
  { cx: 1590, cy: 837, r: 3.5 },
  { cx: 160, cy: 835, r: 4 },
];

const desktopDotTrains: DotTrain[] = [
  { x: 1185, y: 130, width: 6, height: 6, gap: 13, count: 5 },
  { x: 340, y: 831, width: 6, height: 6, gap: 13, count: 5 },
];

const desktopRunners: Runner[] = [
  { pathKey: "top-main", duration: 10, offset: 0.18, r: 3.8 },
  { pathKey: "top-lower", duration: 13, offset: 0.48, r: 3.4 },
  { pathKey: "bottom-main", duration: 14, offset: 0.28, r: 3.8 },
  { pathKey: "bottom-lower", duration: 16, offset: 0.62, r: 3.5 },
];

const mobilePaths: CircuitPath[] = [
  {
    id: "skills-m-top-main",
    pathKey: "top-main",
    className: "skills-bg__path skills-bg__path--primary",
    d: "M242 164 H420 L448 138 H640 L668 164 H760",
  },
  {
    id: "skills-m-top-faint",
    className: "skills-bg__path skills-bg__path--atmospheric",
    d: "M318 112 H620 L648 134 H820",
  },
  {
    id: "skills-m-bottom-main",
    pathKey: "bottom-main",
    className: "skills-bg__path skills-bg__path--primary",
    d: "M0 722 H238 L266 750 H610 L654 792 H937",
  },
  {
    id: "skills-m-bottom-faint",
    className: "skills-bg__path skills-bg__path--atmospheric",
    d: "M0 780 H330 L360 810 H937",
  },
];

const mobileNodes: CircuitNode[] = [
  { cx: 420, cy: 164, r: 3.8, className: "skills-bg__node--hot" },
  { cx: 640, cy: 138, r: 3.5 },
  { cx: 266, cy: 750, r: 3.8, className: "skills-bg__node--hot" },
  { cx: 654, cy: 792, r: 3.8 },
];

const mobileRunners: Runner[] = [
  { pathKey: "top-main", duration: 11.5, offset: 0.18, r: 3.4 },
  { pathKey: "bottom-main", duration: 13, offset: 0.32, r: 3.5 },
];

const renderPaths = (
  paths: CircuitPath[],
  {
    exposeMotionPath = false,
    keyPrefix,
  }: {
    exposeMotionPath?: boolean;
    keyPrefix: string;
  },
) =>
  paths.map(({ className, d, id, pathKey }) => (
    <path
      key={`${keyPrefix}-${id}`}
      id={exposeMotionPath ? id : undefined}
      className={className}
      d={d}
      data-motion-path={exposeMotionPath ? pathKey : undefined}
      data-reveal-mode={pathKey ? "draw" : "fade"}
      pathLength={1}
    />
  ));

const renderNodes = (nodes: CircuitNode[]) =>
  nodes.map(({ className = "", cx, cy, r }) => (
    <circle
      key={`${cx}-${cy}-${r}`}
      className={`skills-bg__node ${className}`.trim()}
      cx={cx}
      cy={cy}
      r={r}
    />
  ));

const renderDotTrains = (trains: DotTrain[]) =>
  trains.flatMap(({ count, gap, height, width, x, y }) =>
    Array.from({ length: count }, (_, index) => (
      <rect
        key={`${x}-${y}-${index}`}
        className="skills-bg__dot-train"
        x={x + index * gap}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
      />
    )),
  );

const renderRunners = (runners: Runner[]) =>
  runners.map(({ duration, offset, pathKey, r }) => (
    <g
      key={pathKey}
      className="skills-bg__runner"
      data-runner-path={pathKey}
      data-runner-duration={duration}
      data-runner-offset={offset}
    >
      <circle className="skills-bg__runner-glow" r={r * 3.2} />
      <circle className="skills-bg__runner-core" r={r} />
      <circle className="skills-bg__runner-spark" cx={r * 0.28} cy={-r * 0.28} r={r * 0.34} />
    </g>
  ));

export const SkillsBackground = forwardRef<HTMLDivElement>(function SkillsBackground(
  _props,
  ref,
) {
  return (
    <div ref={ref} className="skills-bg" data-circuit-active="false" aria-hidden="true">
      <div className="skills-bg__base" data-parallax-layer="base" />
      <div className="skills-bg__grid" data-parallax-layer="grid" />
      <div className="skills-bg__atmosphere" data-parallax-layer="atmosphere" />

      <svg
        className="skills-bg__circuit skills-bg__circuit--desktop"
        data-parallax-layer="desktop-lines"
        data-skills-bg-svg="desktop"
        viewBox="0 0 1670 937"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className="skills-bg__glow-lines">
          {renderPaths(desktopPaths, { keyPrefix: "desktop-glow" })}
        </g>
        <g className="skills-bg__sharp-lines">
          {renderPaths(desktopPaths, {
            exposeMotionPath: true,
            keyPrefix: "desktop-sharp",
          })}
        </g>
        <g className="skills-bg__nodes">{renderNodes(desktopNodes)}</g>
        <g className="skills-bg__dot-trains">{renderDotTrains(desktopDotTrains)}</g>
        <g className="skills-bg__runners" data-parallax-layer="desktop-runners">
          {renderRunners(desktopRunners)}
        </g>
      </svg>

      <svg
        className="skills-bg__circuit skills-bg__circuit--mobile"
        data-parallax-layer="mobile-lines"
        data-skills-bg-svg="mobile"
        viewBox="0 0 937 937"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className="skills-bg__glow-lines">
          {renderPaths(mobilePaths, { keyPrefix: "mobile-glow" })}
        </g>
        <g className="skills-bg__sharp-lines">
          {renderPaths(mobilePaths, {
            exposeMotionPath: true,
            keyPrefix: "mobile-sharp",
          })}
        </g>
        <g className="skills-bg__nodes">{renderNodes(mobileNodes)}</g>
        <g className="skills-bg__runners" data-parallax-layer="mobile-runners">
          {renderRunners(mobileRunners)}
        </g>
      </svg>

      <div className="skills-bg__quiet" />
      <div className="skills-bg__vignette" />
      <div className="skills-bg__seam skills-bg__seam--top" />
      <div className="skills-bg__seam skills-bg__seam--bottom" />
    </div>
  );
});
