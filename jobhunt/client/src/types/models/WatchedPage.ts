type WatchedPage = {
  id: number,
  companyId: number,
  url: string,
  cssSelector?: string,
  cssBlacklist?: string,
  lastScraped?: string,
  lastUpdated?: string,
  statusMessage?: string,
  enabled: boolean,
  requiresJS: boolean
}

export default WatchedPage;