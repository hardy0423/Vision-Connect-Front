import { Country } from "../../features/company/models/country.interface";

export interface CompanyInterface {
  uid?: string;
  name: string;
  region?: string;
  email?: string;
  country?: Country;
  adress?: string;
  user_uid?: string;
  nbr_device?: number;
  is_actif?: boolean;
  logo?: string;
  default_company?:boolean
  [key: string]: any;
}


export interface CompanyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CompanyInterface[];
}
