from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Mô tả hình ảnh cần tạo (Prompt)")
    model: str = Field(default="gpt-image-2", description="Tên model AI (Mặc định: gpt-image-2)")
    modelKey: Optional[str] = Field(default="gpt-image-2")
    aspectRatio: Optional[str] = Field(default="1024x1024", description="Tỷ lệ khung hình camelCase (ví dụ: 1024x1024, 2048x2048, 16:9, 9:16)")
    aspect_ratio: Optional[str] = Field(default=None, description="Tỷ lệ khung hình snake_case (ví dụ: 1:1, 16:9, 9:16, 2048x2048)")
    resolution: Optional[str] = Field(default="1k", description="Độ phân giải kích thước pixel: 1k, 2k, 4k")
    quality: Optional[str] = Field(default="medium", description="Chất lượng render (Sampling/Denoising Steps): low, medium, high (hoặc standard, hd)")
    reference: Optional[str] = Field(default=None, description="URL hoặc Data URI ảnh tham chiếu đơn lẻ")
    references: Optional[List[str]] = Field(default=None, description="Danh sách URL hoặc Data URI ảnh tham chiếu")
    sourceImages: Optional[List[str]] = Field(default=None, description="Danh sách ảnh nguồn (tương thích NCC / Image-to-Image)")
    source_images: Optional[List[str]] = Field(default=None, description="Danh sách ảnh nguồn snake_case")
    mode: Optional[str] = Field(default="generation", description="Chế độ tạo ảnh (generation hoặc edit)")
    count: int = Field(default=1, ge=1, le=4, description="Số lượng ảnh tạo ra")
    executionMode: str = Field(default="sync", description="Chế độ xử lý: sync hoặc async")
    force_refresh: Optional[bool] = Field(default=False, description="Bỏ qua cache và tạo ảnh mới biến thể")
    no_cache: Optional[bool] = Field(default=False, description="Không dùng cache")

class ImageGenerationResponse(BaseModel):
    job_id: str
    status: str
    prompt: str
    model: str
    aspect_ratio: str
    resolution: Optional[str] = "1k"
    quality: Optional[str] = "medium"
    reference: Optional[str] = None
    references: Optional[List[str]] = None
    image_url: Optional[str] = None
    provider_task_id: Optional[str] = None
    charged_amount: float = 150.0
    currency: str = "VND"
    latency_ms: int = 0
    is_cached: bool = False
    created_at: datetime
    error_message: Optional[str] = None

class JobLogItem(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    api_key_name: Optional[str] = None
    key_prefix: Optional[str] = None
    token_in: Optional[int] = 0
    token_out: Optional[int] = 0
    prompt: str
    model: str
    aspect_ratio: str
    resolution: Optional[str] = "1k"
    quality: Optional[str] = "medium"
    reference: Optional[str] = None
    references: Optional[List[str]] = None
    status: str
    is_cached: bool = False
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: int
    cost_provider: Optional[float] = None
    charged_customer: float = 150.0
    profit: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_jobs: int = 0
    successful_jobs: int = 0
    failed_jobs: int = 0
    total_spent: float = 0.0

class FinancialSummary(BaseModel):
    total_deposited: float = Field(..., description="Tổng tiền khách đã nạp vào ví")
    total_api_revenue: float = Field(..., description="Tổng doanh thu từ API bán ra (150đ/req)")
    total_provider_cost: float = Field(..., description="Tổng chi phí trả cho NCC (120đ/req)")
    gross_profit: float = Field(..., description="Lợi nhuận gộp thực tế")
    provider_wallet_balance: float = Field(..., description="Số dư ví hiện tại bên Nhà Cung Cấp")
    total_jobs: int = Field(..., description="Tổng số jobs đã gọi")
    successful_jobs: int = Field(..., description="Số jobs thành công")
    failed_jobs: int = Field(..., description="Số jobs thất bại/lỗi")
    total_cached_jobs: int = Field(default=0, description="Số jobs phục vụ từ Cache (0đ vốn)")
    saved_provider_cost: float = Field(default=0.0, description="Chi phí vốn NCC đã tiết kiệm được nhờ Cache")
    low_balance_warning: bool = Field(default=False, description="Cảnh báo số dư ví NCC thấp cần nạp thêm")

class ProviderStatus(BaseModel):
    is_connected: bool
    provider_name: str
    username: str
    wallet_balance: float
    currency: str
    last_synced_at: datetime
    low_balance_warning: bool = False

class UpdateJobRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Mô tả prompt cập nhật")

class BatchJobActionRequest(BaseModel):
    job_ids: List[str] = Field(..., description="Danh sách ID các jobs cần thao tác")

