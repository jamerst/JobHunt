import CompanyCategory from "./CompanyCategory";
import CompanyName from "./CompanyName";
import Job from "./Job";
import WatchedPage from "./WatchedPage";

type Company = {
  id: number,
  name: string,
  location?: string,
  latitude?: number,
  longitude?: number,
  notes?: string,
  watched: boolean,
  blacklisted: boolean,
  website?: string,
  rating?: number,
  glassdoor?: string,
  linkedIn?: string,
  endole?: string,
  recruiter: boolean,

  jobs: Job[],
  companyCategories: CompanyCategory[],
  alternateNames: CompanyName[],
  watchedPages: WatchedPage[]
}

export default Company;