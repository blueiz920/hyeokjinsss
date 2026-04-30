export const splitTextPolicy = {
  strategy: "no-runtime-splitting",
  rationale:
    "Avoid runtime split-text for performance. Use static markup or CSS-only emphasis.",
  exceptions: {
    allowIntroCharSplit:
      "Allowed only for short hero headings when reduced-motion is false. Must revert on cleanup.",
  },
} as const;

// 예외적으로 허용하는 split 함수
export type SplitResult = { chars: HTMLElement[]; revert: () => void };

type SplitTextToCharsOptions = {
  inheritClassFromSelector?: Array<{ className: string; selector: string }>;
};

export const splitTextToChars = (
  el: HTMLElement,
  options: SplitTextToCharsOptions = {},
): SplitResult => {
  const original = el.innerHTML;

  const frag = document.createDocumentFragment();
  const chars: HTMLElement[] = [];

  const appendText = (text: string, inheritedClassNames: string[]) => {
    for (const ch of text) {
      if (ch === "\n") {
        frag.appendChild(document.createElement("br"));
        continue;
      }
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.display = "inline-block";
      inheritedClassNames.forEach((className) => span.classList.add(className));
      frag.appendChild(span);
      chars.push(span);
    }
  };

  const walkNode = (node: ChildNode, inheritedClassNames: string[] = []) => {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent ?? "", inheritedClassNames);
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (node.tagName === "BR") {
      frag.appendChild(document.createElement("br"));
      return;
    }

    const nextClassNames = [...inheritedClassNames];
    options.inheritClassFromSelector?.forEach(({ className, selector }) => {
      if (node.matches(selector)) {
        nextClassNames.push(className);
      }
    });

    node.childNodes.forEach((child) => walkNode(child, nextClassNames));
  };

  el.childNodes.forEach((node) => walkNode(node));

  el.innerHTML = "";
  el.appendChild(frag);

  return { chars, revert: () => (el.innerHTML = original) };
};
