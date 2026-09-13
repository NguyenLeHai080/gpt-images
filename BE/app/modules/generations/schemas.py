from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Mô tả hình ảnh cần tạo (Prompt)")
    model: str = Field(default="gpt-image-2", description="Tên model AI (Mặc định: gpt-image-2)")
    modelKey: Optional[str] = Field(default="gpt-image-2")
    aspectRatio: str = Field(default="1024x1024", description="Tỷ lệ khung hình (ví dụ: 1024x1024, 16:9, 9:16)")
    count: int = Field(default=1, ge=1, le=4, description="Số lượng ảnh tạo ra")
    executionMode: str = Field(default="sync", description="Chế độ xử lý: sync hoặc async")

class ImageGenerationResponse(BaseModel):
    job_id: str
    status: str
    prompt: str
    model: str
    aspect_ratio: str
    image_url: Optional[str] = None
    provider_task_id: Optional[str] = None
    charged_amount: float = 150.0
    currency: str = "VND"
    latency_ms: int = 0
    created_at: datetime
    error_message: Optional[str] = None

class JobLogItem(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    api_key_name: Optional[str] = None
    prompt: str
    model: str
    aspect_ratio: str
    status: str
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: int
    cost_provider: float
    charged_customer: float
    profit: float
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialSummary(BaseModel):
    total_deposited: float = Field(..., description="Tổng tiền khách đã nạp vào ví")
    total_api_revenue: float = Field(..., description="Tổng doanh thu từ API bán ra (150đ/req)")
    total_provider_cost: float = Field(..., description="Tổng chi phí trả cho NCC (120đ/req)")
    gross_profit: float = Field(..., description="Lợi nhuận gộp thực tế (30đ/req)")
    provider_wallet_balance: float = Field(..., description="Số dư ví hiện tại bên Nhà Cung Cấp")
    total_jobs: int = Field(..., description="Tổng số jobs đã gọi")
    successful_jobs: int = Field(..., description="Số jobs thành công")
    failed_jobs: int = Field(..., description="Số jobs thất bại/lỗi")

class ProviderStatus(BaseModel):
    is_connected: bool
    provider_name: str
    username: str
    wallet_balance: float
    currency: str
    last_synced_at: datetime
