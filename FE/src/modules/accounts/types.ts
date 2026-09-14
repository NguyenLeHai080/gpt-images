export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'MEMBER';

export interface UserAccountItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  has_provider_key?: boolean;
  provider_key_masked?: string | null;
  created_at?: string;
}


export interface AccountStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  super_admins: number;
  admins: number;
  developers: number;
  members: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  company_name: string;
  is_active: boolean;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  role?: UserRole;
  company_name?: string;
  password?: string;
  is_active?: boolean;
}
