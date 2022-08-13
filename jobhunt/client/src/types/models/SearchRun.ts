export type SearchRun = {
  id: number,
  time: string,
  success: boolean,
  message?: string,
  newJobs: number,
  newCompanies: number,
  timeTaken: number
}