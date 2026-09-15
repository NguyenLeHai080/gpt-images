export interface AIProvider {
  id: string;
  name: string;
  provider_code: string;
  base_url: string;
  api_key_masked: string;
  api_key?: string;
  default_model: string;
  models_supported: string[];
  cost_per_image: number;
  is_primary: boolean;
  is_active: boolean;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR';
  latency_ms: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderStats {
  total_providers: number;
  active_providers: number;
  primary_provider?: string;
  primary_provider_url?: string;
  primary_model?: string;
  avg_latency_ms: number;
  avg_cost_vnd: number;
  supported_models_count: number;
}

export interface CreateProviderInput {
  name: string;
  provider_code?: string;
  base_url: string;
  api_key: string;
  default_model: string;
  models_supported: string[];
  cost_per_image: number;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateProviderInput {
  name?: string;
  base_url?: string;
  api_key?: string;
  default_model?: string;
  models_supported?: string[];
  cost_per_image?: number;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface TestConnectionResult {
  provider_id: string;
  provider_name: string;
  is_connected: boolean;
  latency_ms: number;
  http_status?: number;
  message: string;
  tested_at: string;
}
