export interface JobLogItem {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  api_key_name?: string;
  key_prefix?: string;
  token_in?: number;
  token_out?: number;
  prompt: string;
  model: string;
  aspect_ratio: string;
  resolution?: string;
  quality?: 'low' | 'medium' | 'high' | string;
  reference?: string;
  references?: string[];
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  is_cached?: boolean;
  image_url?: string;
  error_message?: string;
  latency_ms: number;
  cost_provider?: number;    // 120đ trả NCC (0đ nếu Cache, chỉ admin thấy)
  charged_customer: number;  // 150đ thu từ khách
  profit?: number;           // 30đ lời gộp (+150đ nếu Cache, chỉ admin thấy)
  created_at: string;
}

export interface UserJobStats {
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  total_spent: number;
}

export interface JobsResponse {
  items: JobLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats?: UserJobStats;
}

export interface FinancialSummary {
  total_deposited: number;
  total_api_revenue: number;
  total_provider_cost: number;
  gross_profit: number;
  provider_wallet_balance: number;
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  total_cached_jobs?: number;
  saved_provider_cost?: number;
  low_balance_warning?: boolean;
}

export interface ProviderStatus {
  is_connected: boolean;
  provider_name: string;
  username: string;
  wallet_balance: number;
  currency: string;
  last_synced_at: string;
  low_balance_warning?: boolean;
}

export interface GenerateImagePayload {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  resolution?: '1k' | '2k' | '4k' | string;
  quality?: 'low' | 'medium' | 'high' | string;
  reference?: string;
  references?: string[];
  count?: number;
  executionMode?: string;
  force_refresh?: boolean;
  no_cache?: boolean;
}

export interface GenerateImageResult {
  job_id: string;
  status: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  resolution?: string;
  quality?: string;
  reference?: string;
  references?: string[];
  image_url?: string;
  provider_task_id?: string;
  charged_amount: number;
  currency: string;
  latency_ms: number;
  is_cached?: boolean;
  created_at: string;
  error_message?: string;
}
