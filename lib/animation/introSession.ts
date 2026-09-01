export const INTRO_SESSION_KEY = "portfolio:intro-seen";

export const INTRO_SESSION_BOOTSTRAP = `try{if(sessionStorage.getItem("${INTRO_SESSION_KEY}")==="true"){document.documentElement.dataset.introSeen="true"}}catch{}`;

export const isIntroSeen = () => {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true";
  } catch {
    return false;
  }
};

export const saveIntroSeen = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
  } catch {}
};
