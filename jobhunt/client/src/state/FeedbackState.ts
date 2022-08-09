import { atom } from "recoil";

type FeedbackState = {
  loading: boolean,
  success: boolean,
  error: boolean,
}

const feedbackState = atom<FeedbackState>({
  key: "loadingState",
  default: { loading: false, success: false, error: false }
});

export default feedbackState;