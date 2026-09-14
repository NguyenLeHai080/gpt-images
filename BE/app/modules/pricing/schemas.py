from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class ResolutionRate(BaseModel):
    key: str
    label: str
    dimension: str
    multiplier: float
    unit_price: float

class QualityRate(BaseModel):
    key: str
    label: str
    multiplier: float
    description: str

class ModelPricingItem(BaseModel):
    model: str
    display_name: str
    provider: str
    base_price: float
    provider_cost: Optional[float] = None
    token_rate: int = 1024
    profit_amount: Optional[float] = None
    profit_margin_pct: Optional[float] = None
    currency: str = "VND"
    unit: str = "ảnh"
    status: str = "ACTIVE"
    latency_range: str
    smart_cache_support: bool = True
    cache_cost: float = 0.0
    resolutions: List[ResolutionRate]
    qualities: List[QualityRate]
    description: str

class CreateModelPricingRequest(BaseModel):
    model: str = Field(..., min_length=2, max_length=64, description="Mã định danh model (vd: gpt-image-3, dall-e-3)")
    display_name: str = Field(..., min_length=2, max_length=128, description="Tên hiển thị model")
    provider: str = Field("Leeh AI Cloud", max_length=128, description="Nhà cung cấp")
    provider_cost: float = Field(..., ge=0, description="Chi phí vốn trả cho Nhà cung cấp (VND)")
    base_price: float = Field(..., ge=0, description="Giá bán API niêm yết thu từ khách (VND)")
    token_rate: int = Field(1024, ge=1, description="Số token tương đương / lượt gọi")
    currency: str = Field("VND", max_length=16)
    unit: str = Field("ảnh", max_length=32)
    status: str = Field("ACTIVE", description="ACTIVE hoặc MAINTENANCE")
    latency_range: Optional[str] = Field("25ms (Cache) - 3.2s (Gen)", max_length=64)
    smart_cache_support: bool = Field(True)
    cache_cost: float = Field(0.0, ge=0)
    description: Optional[str] = Field(None, description="Mô tả chi tiết về model")

class UpdateModelPricingRequest(BaseModel):
    provider_cost: Optional[float] = Field(None, ge=0, description="Chi phí vốn trả cho Nhà cung cấp (VND)")
    base_price: Optional[float] = Field(None, ge=0, description="Giá bán API niêm yết thu từ khách (VND)")
    token_rate: Optional[int] = Field(None, ge=1, description="Số token tương đương / lượt gọi")
    status: Optional[str] = Field(None, description="ACTIVE hoặc MAINTENANCE")
    display_name: Optional[str] = None
    provider: Optional[str] = None
    latency_range: Optional[str] = None
    smart_cache_support: Optional[bool] = None
    description: Optional[str] = None

class PricingSimulatorRequest(BaseModel):
    model: str = "gpt-image-2"
    monthly_images: int = 1000
    resolution: str = "2k"
    quality: str = "high"
    cache_hit_rate_pct: int = 35

class PricingSimulatorResponse(BaseModel):
    monthly_images: int
    unit_price: float
    estimated_total_raw: float
    estimated_cache_savings: float
    estimated_monthly_cost: float
    recommended_package: str
