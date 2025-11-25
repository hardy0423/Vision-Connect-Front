import { CompanyInterface } from "./company.interface";

export enum UserRole {
  Superadmin = 'super-admin',
  Admin = 'admin',
  User = 'user',
  Moderator = 'moderator',
}

export interface UserInterface {
  uid?: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_hash?: string;
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  slug?: string;
  is_active?: boolean;
  companies?: CompanyInterface;
  is_from_ldap?: boolean;
  confirm_password?: String;
  password_changed?: boolean;
  isPasswordUpdate?: boolean;
  [key: string]: any;
}

/**
 * Interface User
 */
export interface User {
  uid?: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_hash?: string;
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface UserWithCompanyDetailInterface {
  uid: string;
  username: string;
  email: string;
  last_name: string;
  slug: string;
  first_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  role: string;
  default_password: string;
  password_changed: boolean;
  created_by: string | null;
  is_admin: boolean;
  total_device: number;
  companies: CompanyInterface | null;
}
