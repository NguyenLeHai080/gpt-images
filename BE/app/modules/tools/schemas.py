from typing import Optional
from pydantic import BaseModel

class SystemGatewayConfig(BaseModel):
    smart_cache_enabled: bool = True
    smart_cache_ttl_hours: int = 168  # 7 days
    smart_cache_entries: int = 42
    smart_cache_size_mb: float = 1.85
    cache_hit_rate_pct: float = 38.5
    upstream_provider_name: str = "Leeh AI Cloud"
    upstream_endpoint: str = "https://api.leeh.dev"
    upstream_timeout_sec: int = 60
    fallback_provider_enabled: bool = True
    fallback_provider_name: str = "OpenAI Direct Fallback"
    rate_limit_per_min: int = 120
    low_balance_alert_threshold: float = 50000.0
    webhook_notification_url: Optional[str] = "https://mintforge.vn/webhook/alerts"
    status: str = "HEALTHY"

class UpdateGatewayConfigRequest(BaseModel):
    smart_cache_enabled: Optional[bool] = None
    smart_cache_ttl_hours: Optional[int] = None
    upstream_timeout_sec: Optional[int] = None
    fallback_provider_enabled: Optional[bool] = None
    rate_limit_per_min: Optional[int] = None
    low_balance_alert_threshold: Optional[float] = None
    webhook_notification_url: Optional[str] = None
