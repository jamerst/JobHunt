import Company from "./Company";
import { WatchedPageChange } from "./WatchedPageChange";

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
  requiresJS: boolean,

  company: Company,
  changes: WatchedPageChange[]
}

export default WatchedPage;