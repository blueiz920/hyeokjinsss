export type PhraseMaskBox = {
  height: number;
  left: number;
  maskImage: string;
  top: number;
  width: number;
};

const escapeSvgText = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const canUseCssMask = () =>
  typeof CSS !== "undefined" &&
  (CSS.supports("mask-image", "linear-gradient(#000, #000)") ||
    CSS.supports("-webkit-mask-image", "linear-gradient(#000, #000)"));

export const createPhraseMask = (
  heading: HTMLElement,
  host: HTMLElement,
  phrase: string,
  width: number,
  height: number,
) => {
  const style = window.getComputedStyle(heading);
  const hostStyle = window.getComputedStyle(host);
  const fontSize = Number.parseFloat(style.fontSize);
  const fontFamily = escapeSvgText(style.fontFamily);
  const fontWeight = escapeSvgText(style.fontWeight);
  const escapedPhrase = escapeSvgText(phrase);
  const maskYOffset = Number.parseFloat(
    hostStyle.getPropertyValue("--intro-phrase-mask-y") || "0",
  );
  const baselineY = height * 0.52 + (Number.isFinite(maskYOffset) ? maskYOffset : 0);
  const textLength = Math.max(1, width);

  // SVG text mask를 data URL로 만들어 video 레이어에 CSS mask로 씌움.
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    `<text x="${width / 2}" y="${baselineY}" text-anchor="middle" dominant-baseline="central"`,
    ` font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${fontSize}"`,
    ` textLength="${textLength}" lengthAdjust="spacing" fill="white">${escapedPhrase}</text>`,
    "</svg>",
  ].join("");

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
