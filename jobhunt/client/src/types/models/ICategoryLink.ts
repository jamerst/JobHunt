import Category from "./Category";

/**
 * Interface for a Category link entity (i.e. JobCategory or CompanyCategory)
 */
export interface ICategoryLink {
  categoryId: number,
  category: Category
}