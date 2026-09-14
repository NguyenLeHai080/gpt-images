export interface PackageItem {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus_credits: number;
  discount_pct: number;
  badge?: string | null;
  description: string;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
}

export interface CreatePackageData {
  name: string;
  price: number;
  credits: number;
  bonus_credits: number;
  discount_pct: number;
  badge?: string;
  description: string;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
}
