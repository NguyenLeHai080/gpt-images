from datetime import datetime
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
    def get_overview() -> DashboardOverviewResponse:
        now = datetime.now()
        date_display = "Chủ Nhật, 13 tháng 9, 2026"

        metrics = [
            MetricItem(
                id="api_balance",
                title="Số dư API",
                value="24.702 đ",
                numeric_value=24702,
                unit="đ",
                badge_text="↗ Trực tiếp: Số dư khả dụng",
                badge_type="success",
                icon="wallet"
            ),
            MetricItem(
                id="total_deposit",
                title="Tổng tiền nạp",
                value="4.331.500 đ",
                numeric_value=4331500,
                unit="đ",
                badge_text="↗ Theo giao dịch",
                badge_type="success",
                icon="trending-up"
            ),
            MetricItem(
                id="api_cost",
                title="Chi phí API",
                value="480 đ",
                numeric_value=480,
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
            total_managed=28,
            active_keys=28,
            other_keys=0
        )

        recent_activities = [
            ActivityItem(
                id="act_1",
                user_name="Nguyen Le Hai",
                model_name="gpt-image-2",
                status="success",
                cost="120 đ",
                timestamp="14:19:09 12/9/2026"
            ),
            ActivityItem(
                id="act_2",
                user_name="Nguyen Le Hai",
                model_name="gpt-image-2",
                status="success",
                cost="120 đ",
                timestamp="14:18:22 12/9/2026"
            ),
            ActivityItem(
                id="act_3",
                user_name="Nguyen Le Hai",
                model_name="gpt-image-2",
                status="success",
                cost="120 đ",
                timestamp="14:15:10 12/9/2026"
            ),
            ActivityItem(
                id="act_4",
                user_name="Nguyen Le Hai",
                model_name="gpt-image-2",
                status="success",
                cost="120 đ",
                timestamp="14:10:05 12/9/2026"
            )
        ]

        operation_summary = OperationSummary(
            active_keys=28,
            synced_keys=28,
            successful_requests=33861,
            uptime="99.9%"
        )

        model_distribution = [
            ModelDistributionItem(
                model_id="gpt-image-2",
                model_name="gpt-image-2",
                request_count=30,
                cost_amount="480 đ",
                badge="GP"
            )
        ]

        return DashboardOverviewResponse(
            date_display=date_display,
            metrics=metrics,
            chart_data=chart_data,
            key_status=key_status,
            recent_activities=recent_activities,
            operation_summary=operation_summary,
            model_distribution=model_distribution
        )

dashboard_service = DashboardService()
