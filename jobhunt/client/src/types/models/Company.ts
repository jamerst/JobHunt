import CompanyCategory from "./CompanyCategory";

type Company = {
  Id: number,
  Name: string,
  Location: string,
  Latitude?: number,
  Longitude?: number,
  Notes?: string,
  Watched: boolean,
  Blacklisted: boolean,
  Website?: string,
  Rating?: number,
  Glassdoor?: string,
  LinkedIn?: string,
  Endole?: string,
  Recruiter: boolean,

  CompanyCategories: CompanyCategory[]
}

export default Company;