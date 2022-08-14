import WatchedPage from "./WatchedPage"

export type WatchedPageChange = {
  id: number,
  watchedPageId: number,
  created: string,
  html: string,
  screenshotFileName?: string,

  watchedPage: WatchedPage
}