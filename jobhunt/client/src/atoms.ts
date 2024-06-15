import { atom } from "jotai";

type FeedbackState = {
  loading: boolean,
  success: boolean,
  error: boolean,
}

export const feedbackAtom = atom<FeedbackState>({ loading: false, success: false, error: false });

type ThemeState = "light" | "dark"

const getDefaultTheme = () => {
  if (localStorage.getItem("theme") === "dark" || (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("theme") === null)) {
    return "dark";
  } else {
    return "light";
  }
}

export const themeAtom = atom<ThemeState>(getDefaultTheme());