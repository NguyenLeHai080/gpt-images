from typing import Optional, List
from pydantic import BaseModel, Field

class ProviderItem(BaseModel):
    id: str
    name: str
    provider_code: str
    base_url: str
    api_key_masked: str
    api_key: Optional[str] = None
    default_model: str
    models_supported: List[str] = []
    cost_per_image: float
    is_primary: bool
    is_active: bool
    status: str
    latency_ms: int
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CreateProviderRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    provider_code: Optional[str] = None
    base_url: str = Field(..., min_length=8, max_length=255)
    api_key: str = Field(..., min_length=4, max_length=255)
    default_model: str = "gpt-image-2.5-flare"
    models_supported: List[str] = []
    cost_per_image: float = 75.0
    is_primary: bool = False
    is_active: bool = True
    notes: Optional[str] = None

class UpdateProviderRequest(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    default_model: Optional[str] = None
    models_supported: Optional[List[str]] = None
    cost_per_image: Optional[float] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class TestConnectionResponse(BaseModel):
    provider_id: str
    provider_name: str
    is_connected: bool
    latency_ms: int
    http_status: Optional[int] = None
    message: str
    tested_at: str

class ProviderStatsResponse(BaseModel):
    total_providers: int
    active_providers: int
    primary_provider: Optional[str] = None
    primary_provider_url: Optional[str] = None
    primary_model: Optional[str] = None
    avg_latency_ms: int = 0
    avg_cost_vnd: float = 0.0
    supported_models_count: int = 0
