import Company from "./Company";
import JobCategory from "./JobCategory";
import { Search } from "./Search";

type Job = {
  id: number,
  title: string,
  description: string,
  salary?: string,
  avgYearlySalary?: number,
  remote: boolean,
  location: string,
  latitude?: number,
  longitude?: number,
  url?: string,
  companyId?: number,
  posted: string,
  notes: string,
  seen: boolean,
  archived: boolean,
  status: string,
  dateApplied: string,
  provider?: string,
  providerId?: string,
  sourceId?: number,
  duplicateJobId?: number,
  actualCompanyId?: number,

  company: Company,
  duplicateJob?: Job,
  actualCompany?: Company,
  jobCategories: JobCategory[],
  source?: Search
}

export default Job;