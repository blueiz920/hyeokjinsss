export type IntroMaskRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const INTRO_MASK_ELEMENT_SELECTOR =
  ".intro-title-mask-char, [data-intro-mask-phrase-anchor]";

// 인트로 강조 문구를 감싸는 전체 화면 좌표를 계산함.
export const measureIntroMask = (heading: HTMLElement): IntroMaskRect | null => {
  const rects = [...heading.querySelectorAll<HTMLElement>(INTRO_MASK_ELEMENT_SELECTOR)]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (!rects.length) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return {
    height: bottom - top,
    left,
    top,
    width: right - left,
  };
};
