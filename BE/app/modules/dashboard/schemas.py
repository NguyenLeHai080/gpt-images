from typing import List, Optional
from pydantic import BaseModel

class MetricItem(BaseModel):
    id: str
    title: str
    value: str
    numeric_value: float
    unit: Optional[str] = "đ"
    badge_text: str
    badge_type: str  # "success" | "warning" | "info" | "purple"
    icon: str

class ChartPoint(BaseModel):
    day: str
    cost: float
    requests: int

class ApiKeyStatus(BaseModel):
    total_managed: int = 28
    active_keys: int = 28
    other_keys: int = 0

class ActivityItem(BaseModel):
    id: str
    user_name: str
    model_name: str
    status: str
    cost: str
    timestamp: str

class OperationSummary(BaseModel):
    active_keys: int = 28
    synced_keys: int = 28
    successful_requests: int = 33861
    uptime: str = "99.9%"

class ModelDistributionItem(BaseModel):
    model_id: str
    model_name: str
    request_count: int
    cost_amount: str
    badge: str

class AccountOption(BaseModel):
    id: str
    name: str
    email: str
    role: str

class DashboardOverviewResponse(BaseModel):
    date_display: str
    metrics: List[MetricItem]
    chart_data: List[ChartPoint]
    key_status: ApiKeyStatus
    recent_activities: List[ActivityItem]
    operation_summary: OperationSummary
    model_distribution: List[ModelDistributionItem]
    scope_type: str = "all"  # "all" | "user"
    scope_user_name: Optional[str] = "Toàn hệ thống"
    accounts: Optional[List[AccountOption]] = None
    is_exhausted: bool = False
    available_images: int = 0
    user_balance: float = 0.0
    provider_balance: Optional[float] = None
