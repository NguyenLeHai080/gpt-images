export interface SystemGatewayConfig {
  smart_cache_enabled: boolean;
  smart_cache_ttl_hours: number;
  smart_cache_entries: number;
  smart_cache_size_mb: number;
  cache_hit_rate_pct: number;
  upstream_provider_name: string;
  upstream_endpoint: string;
  upstream_timeout_sec: number;
  fallback_provider_enabled: boolean;
  fallback_provider_name: string;
  rate_limit_per_min: number;
  low_balance_alert_threshold: number;
  webhook_notification_url?: string;
  status: string;
}

export interface UpdateGatewayConfigRequest {
  smart_cache_enabled?: boolean;
  smart_cache_ttl_hours?: number;
  upstream_timeout_sec?: number;
  fallback_provider_enabled?: boolean;
  rate_limit_per_min?: number;
  low_balance_alert_threshold?: number;
  webhook_notification_url?: string;
}
