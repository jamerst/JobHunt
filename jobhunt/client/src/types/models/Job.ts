import { Dayjs } from "dayjs";
import Company from "./Company";
import JobCategory from "./JobCategory";
import { Search } from "./Search";

export type Job = {
  Id: number,
  Title: string,
  Description: string,
  Salary?: string,
  AvgYearlySalary?: number,
  Location: string,
  Latitude?: number,
  Longitude?: number,
  Url?: string,
  CompanyId?: number,
  Posted: string,
  Notes: string,
  Seen: boolean,
  Archived: boolean,
  Status: string,
  DateApplied: string,
  Provider?: string,
  ProviderId?: string,
  SourceId?: number,
  DuplicateJobId?: number,
  ActualCompanyId?: number,

  Company?: Company,
  ActualCompany?: Company,
  JobCategories: JobCategory[],
  Source?: Search
}