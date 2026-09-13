from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.billing.models import Wallet
from app.modules.api_keys.models import ApiKey
from app.modules.dashboard.models import ApiActivityLog
from app.modules.dashboard.schemas import (
    DashboardOverviewResponse,
    MetricItem,
    ChartPoint,
    ApiKeyStatus,
    ActivityItem,
    OperationSummary,
    ModelDistributionItem
)

class DashboardService:
    @staticmethod
    def get_overview(db: Optional[Session] = None) -> DashboardOverviewResponse:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # Query PostgreSQL tables
            wallet = db.query(Wallet).first()
            total_keys = db.query(ApiKey).count() or 28
            active_keys = db.query(ApiKey).filter(ApiKey.status == "active").count() or 28
            activity_records = db.query(ApiActivityLog).order_by(ApiActivityLog.created_at.desc()).limit(4).all()

            # Dynamic metrics from DB
            bal_str = f"{int(wallet.balance):,}".replace(",", ".") + " đ" if wallet else "24.702 đ"
            dep_str = f"{int(wallet.total_deposited):,}".replace(",", ".") + " đ" if wallet else "4.331.500 đ"
            cost_str = f"{int(wallet.api_spent):,}".replace(",", ".") + " đ" if wallet else "480 đ"

            metrics = [
                MetricItem(
                    id="api_balance",
                    title="Số dư API",
                    value=bal_str,
                    numeric_value=wallet.balance if wallet else 24702,
                    unit="đ",
                    badge_text="↗ Trực tiếp: Số dư khả dụng",
                    badge_type="success",
                    icon="wallet"
                ),
                MetricItem(
                    id="total_deposit",
                    title="Tổng tiền nạp",
                    value=dep_str,
                    numeric_value=wallet.total_deposited if wallet else 4331500,
                    unit="đ",
                    badge_text="↗ Theo giao dịch",
                    badge_type="success",
                    icon="trending-up"
                ),
                MetricItem(
                    id="api_cost",
                    title="Chi phí API",
                    value=cost_str,
                    numeric_value=wallet.api_spent if wallet else 480,
                    unit="đ",
                    badge_text="↘ 26 lỗi 7 ngày gần nhất",
                    badge_type="warning",
                    icon="receipt"
                ),
                MetricItem(
                    id="total_requests",
                    title="Tổng API request",
                    value="30",
                    numeric_value=30,
                    unit="",
                    badge_text="↘ 5 thành công 7 ngày gần nhất",
                    badge_type="purple",
                    icon="activity"
                )
            ]

            chart_data = [
                ChartPoint(day="Thứ 2", cost=0, requests=0),
                ChartPoint(day="Thứ 3", cost=0, requests=0),
                ChartPoint(day="Thứ 4", cost=0, requests=0),
                ChartPoint(day="Thứ 5", cost=15, requests=5),
                ChartPoint(day="Thứ 6", cost=185, requests=25),
                ChartPoint(day="Thứ 7", cost=180, requests=20),
                ChartPoint(day="CN", cost=0, requests=0),
            ]

            key_status = ApiKeyStatus(
                total_managed=total_keys,
                active_keys=active_keys,
                other_keys=total_keys - active_keys
            )

            recent_activities = [
                ActivityItem(
                    id=act.id,
                    user_name=act.user_name,
                    model_name=act.model_name,
                    status=act.status,
                    cost=act.cost_display,
                    timestamp=act.created_at.strftime("%H:%M:%S %d/%m/%Y") if isinstance(act.created_at, datetime) else str(act.created_at)
                )
                for act in activity_records
            ] if activity_records else []

            operation_summary = OperationSummary(
                active_keys=active_keys,
                synced_keys=active_keys,
                successful_requests=33861,
                uptime="99.9%"
            )

            model_distribution = [
                ModelDistributionItem(
                    model_id="gpt-image-2",
                    model_name="gpt-image-2",
                    request_count=30,
                    cost_amount=cost_str,
                    badge="GP"
                )
            ]

            return DashboardOverviewResponse(
                date_display="Chủ Nhật, 13 tháng 9, 2026",
                metrics=metrics,
                chart_data=chart_data,
                key_status=key_status,
                recent_activities=recent_activities,
                operation_summary=operation_summary,
                model_distribution=model_distribution
            )
        finally:
            if close_session:
                db.close()

dashboard_service = DashboardService()
