export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'MEMBER';
  avatar_url?: string;
  company_name: string;
  is_active?: boolean;
  permissions?: string[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  badge?: string;
  active?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: NavItem[];
}
