import { SearchRun } from "./SearchRun"

export type Search = {
  id: number,
  provider: string,
  query: string,
  country: string,
  location?: string,
  distance?: number,
  maxAge?: number,
  lastResultCount?: number,
  lastFetchSuccess?: boolean,
  enabled: boolean,
  employerOnly: boolean,
  jobType?: string,
  lastRun?: string,

  runs: SearchRun[],

  displayName: string,
}