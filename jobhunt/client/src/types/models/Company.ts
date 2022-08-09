import CompanyCategory from "./CompanyCategory";
import CompanyName from "./CompanyName";

type Company = {
  id: number,
  name: string,
  location: string,
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

  companyCategories: CompanyCategory[],
  alternateNames: CompanyName[]
}

export default Company;