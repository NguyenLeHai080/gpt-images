from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Mô tả hình ảnh cần tạo (Prompt)")
    model: str = Field(default="gpt-image-2.5-flare", description="Tên model AI (Mặc định: gpt-image-2.5-flare)")
    modelKey: Optional[str] = Field(default=None)
    size: Optional[str] = Field(default=None, description="Kích thước pixel theo chuẩn OpenAI: 1024x1024 (1:1), 1792x1024 (16:9), 1024x1792 (9:16), 1408x1056 (4:3), 1056x1408 (3:4), 1536x1024 (3:2), 1024x1536 (2:3); 2K: 2048x2048, 3584x2048, 2048x3584; 4K: 4096x4096, 3840x2160, 2160x3840")
    aspectRatio: Optional[str] = Field(default=None, description="Tỷ lệ khung hình camelCase: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 hoặc kích thước pixel WIDTHxHEIGHT")
    aspect_ratio: Optional[str] = Field(default=None, description="Tỷ lệ khung hình snake_case: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 hoặc kích thước pixel WIDTHxHEIGHT")
    resolution: Optional[str] = Field(default="1k", description="Độ phân giải kích thước pixel: 1k, 2k, 4k")
    quality: Optional[str] = Field(default="medium", description="Chất lượng render (Sampling/Denoising Steps): low, medium, high (hoặc standard, hd)")
    reference: Optional[str] = Field(default=None, description="URL hoặc Data URI ảnh tham chiếu đơn lẻ")
    references: Optional[List[str]] = Field(default=None, description="Danh sách URL hoặc Data URI ảnh tham chiếu")
    sourceImages: Optional[List[str]] = Field(default=None, description="Danh sách ảnh nguồn (tương thích NCC / Image-to-Image)")
    source_images: Optional[List[str]] = Field(default=None, description="Danh sách ảnh nguồn snake_case")
    image: Optional[Any] = Field(default=None, description="URL hoặc base64 ảnh tham chiếu (alias OpenAI / Midjourney / Webhook)")
    images: Optional[List[Any]] = Field(default=None, description="Danh sách ảnh tham chiếu (alias OpenAI / Midjourney)")
    image_url: Optional[Any] = Field(default=None, description="URL ảnh tham chiếu (alias OpenAI)")
    imageUrl: Optional[Any] = Field(default=None, description="URL ảnh tham chiếu camelCase")
    image_urls: Optional[List[Any]] = Field(default=None, description="Danh sách URL ảnh tham chiếu")
    input_image: Optional[Any] = Field(default=None, description="Ảnh nguồn đầu vào")
    input_images: Optional[List[Any]] = Field(default=None, description="Danh sách ảnh nguồn đầu vào")
    ref: Optional[Any] = Field(default=None, description="Ảnh tham chiếu viết tắt")
    ref_image: Optional[Any] = Field(default=None, description="Ảnh tham chiếu")
    ref_images: Optional[List[Any]] = Field(default=None, description="Danh sách ảnh tham chiếu")
    file: Optional[Any] = Field(default=None, description="File ảnh tham chiếu URL")
    files: Optional[List[Any]] = Field(default=None, description="Danh sách file ảnh tham chiếu")
    mode: Optional[str] = Field(default="generation", description="Chế độ tạo ảnh (generation hoặc edit)")
    count: int = Field(default=1, ge=1, le=4, description="Số lượng ảnh tạo ra")
    n: Optional[int] = Field(default=None, ge=1, le=4, description="Số lượng ảnh theo chuẩn OpenAI (alias cho count)")
    response_format: Optional[str] = Field(default="url", description="Định dạng trả về theo chuẩn OpenAI: url hoặc b64_json")
    executionMode: str = Field(default="sync", description="Chế độ xử lý: sync hoặc async")
    force_refresh: Optional[bool] = Field(default=False, description="Bỏ qua cache và tạo ảnh mới biến thể")
    no_cache: Optional[bool] = Field(default=False, description="Không dùng cache")

    class Config:
        extra = "allow"

class ImageGenerationResponse(BaseModel):
    job_id: str
    status: str
    prompt: str
    model: str = "gpt-image-2.5-flare"
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
    created: Optional[int] = None
    data: Optional[List[Dict[str, Any]]] = None
    retry_count: Optional[int] = 0
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
    retry_count: Optional[int] = 0
    error_message: Optional[str] = None
    latency_ms: int
    provider_name: Optional[str] = None
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
    total_provider_cost: float = Field(..., description="Tổng chi phí trả cho NCC (75đ/req)")
    gross_profit: float = Field(..., description="Lợi nhuận gộp thực tế")
    provider_wallet_balance: float = Field(..., description="Số dư ví hiện tại bên Nhà Cung Cấp")
    total_jobs: int = Field(..., description="Tổng số jobs đã gọi")
    successful_jobs: int = Field(..., description="Số jobs thành công")
    failed_jobs: int = Field(..., description="Số jobs thất bại/lỗi")
    total_cached_jobs: int = Field(default=0, description="Số jobs phục vụ từ Cache (0đ vốn)")
    saved_provider_cost: float = Field(default=0.0, description="Chi phí vốn NCC đã tiết kiệm được nhờ Cache")
    low_balance_warning: bool = Field(default=False, description="Cảnh báo số dư ví NCC thấp cần nạp thêm")

class ModelRateItem(BaseModel):
    model: str
    display_name: str
    cost_per_req: float
    unit: str = "đ / request"

class ProviderStatus(BaseModel):
    is_connected: bool
    provider_name: str
    username: str
    wallet_balance: float
    currency: str
    last_synced_at: datetime
    low_balance_warning: bool = False
    budget_total: Optional[float] = 0.0
    budget_used: Optional[float] = 0.0
    budget_remaining: Optional[float] = 0.0
    used_percent: Optional[float] = 0.0
    key_masked: Optional[str] = None
    status_text: Optional[str] = "Chưa cấu hình"
    models_rates: Optional[List[ModelRateItem]] = None

class UpdateJobRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Mô tả prompt cập nhật")

class BatchRetryRequest(BaseModel):
    job_ids: List[str] = Field(..., description="Danh sách ID các jobs cần thử lại")

class BatchJobActionRequest(BaseModel):
    job_ids: List[str] = Field(..., description="Danh sách ID các jobs cần thao tác")

class UpdateMaintenanceRequest(BaseModel):
    is_maintenance: bool = Field(..., description="Trạng thái bật/tắt bảo trì toàn hệ thống")
    message: Optional[str] = Field(None, description="Thông điệp thông báo gửi tới khách hàng")


