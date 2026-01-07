export const splitTextPolicy = {
  strategy: "no-runtime-splitting",
  rationale:
    "Avoid runtime split-text for performance. Use static markup or CSS-only emphasis.",
  exceptions: {
    allowIntroCharSplit:
      "Allowed only for short hero headings when reduced-motion is false. Must revert on cleanup.",
  },
} as const;

// ✅ 예외적으로 허용하는 '가벼운' split 함수(플러그인 없이)
export type SplitResult = { chars: HTMLElement[]; revert: () => void };

export const splitTextToChars = (el: HTMLElement): SplitResult => {
  const original = el.innerHTML;
  const text = el.textContent ?? "";

  const frag = document.createDocumentFragment();
  const chars: HTMLElement[] = [];

  for (const ch of text) {
    if (ch === "\n") {
      frag.appendChild(document.createElement("br"));
      continue;
    }
    const span = document.createElement("span");
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.display = "inline-block";
    frag.appendChild(span);
    chars.push(span);
  }

  el.innerHTML = "";
  el.appendChild(frag);

  return { chars, revert: () => (el.innerHTML = original) };
};