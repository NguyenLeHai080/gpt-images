export interface ResolutionRate {
  key: string;
  label: string;
  dimension: string;
  multiplier: number;
  unit_price: number;
}

export interface QualityRate {
  key: string;
  label: string;
  multiplier: number;
  description: string;
}

export interface ModelPricingItem {
  model: string;
  display_name: string;
  provider: string;
  base_price: number;
  provider_cost?: number;
  token_rate: number;
  profit_amount?: number;
  profit_margin_pct?: number;
  currency: string;
  unit: string;
  status: string;
  latency_range: string;
  smart_cache_support: boolean;
  cache_cost: number;
  resolutions: ResolutionRate[];
  qualities: QualityRate[];
  description: string;
}

export interface CreateModelPricingRequest {
  model: string;
  display_name: string;
  provider: string;
  provider_cost: number;
  base_price: number;
  token_rate: number;
  currency?: string;
  unit?: string;
  status: string;
  latency_range?: string;
  smart_cache_support?: boolean;
  cache_cost?: number;
  description?: string;
}

export interface UpdateModelPricingRequest {
  provider_cost?: number;
  base_price?: number;
  token_rate?: number;
  status?: string;
  display_name?: string;
  provider?: string;
  latency_range?: string;
  smart_cache_support?: boolean;
  description?: string;
}

export interface PricingSimulatorRequest {
  model: string;
  monthly_images: number;
  resolution: string;
  quality: string;
  cache_hit_rate_pct: number;
}

export interface PricingSimulatorResponse {
  monthly_images: number;
  unit_price: number;
  estimated_total_raw: number;
  estimated_cache_savings: number;
  estimated_monthly_cost: number;
  recommended_package: string;
}
