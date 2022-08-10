import { atom } from "recoil";

type FeedbackState = {
  loading: boolean,
  success: boolean,
  error: boolean,
}

export const feedbackState = atom<FeedbackState>({
  key: "feedbackState",
  default: { loading: false, success: false, error: false }
});

type ThemeState = "light" | "dark"

const getDefaultTheme = () => {
  if (localStorage.getItem("theme") === "dark" || (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("theme") === null)) {
    return "dark";
  } else {
    return "light";
  }
}

export const themeState = atom<ThemeState>({
  key: "themeState",
  default: getDefaultTheme()
});