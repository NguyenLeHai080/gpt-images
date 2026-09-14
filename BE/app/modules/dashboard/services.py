from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.auth.models import User
from app.modules.billing.models import Wallet
from app.modules.api_keys.models import ApiKey
from app.modules.generations.models import ImageGenerationJob
from app.modules.dashboard.models import ApiActivityLog
from app.modules.dashboard.schemas import (
    DashboardOverviewResponse,
    MetricItem,
    ChartPoint,
    ApiKeyStatus,
    ActivityItem,
    OperationSummary,
    ModelDistributionItem,
    AccountOption
)

class DashboardService:
    @staticmethod
    def get_overview(
        user: Optional[User] = None,
        target_user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> DashboardOverviewResponse:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # 1. Xác định phân quyền và phạm vi dữ liệu (Scope)
            is_admin = bool(user and user.role in ("SUPER_ADMIN", "ADMIN"))
            
            if is_admin:
                if target_user_id and target_user_id != "all":
                    target_user = db.query(User).filter(User.id == target_user_id).first()
                    scope_user_id = target_user.id if target_user else None
                    scope_type = "user" if target_user else "all"
                    scope_user_name = (target_user.full_name or target_user.email) if target_user else "Toàn hệ thống"
                else:
                    scope_user_id = None
                    scope_type = "all"
                    scope_user_name = "Toàn hệ thống (Admin)"
            else:
                # User thường: Bắt buộc chỉ load dữ liệu tài khoản của chính mình
                scope_user_id = user.id if user else None
                scope_type = "user"
                scope_user_name = (user.full_name or user.email) if user else "Tài khoản cá nhân"

            # 2. Dữ liệu Tài chính & Ví
            if scope_user_id:
                wallet = db.query(Wallet).filter(Wallet.user_id == scope_user_id).first()
                balance = wallet.balance if wallet else 0.0
                total_deposit = wallet.total_deposited if wallet else 0.0
                api_spent = wallet.api_spent if wallet else 0.0
            else:
                balance = db.query(func.sum(Wallet.balance)).scalar() or 0.0
                total_deposit = db.query(func.sum(Wallet.total_deposited)).scalar() or 0.0
                api_spent = db.query(func.sum(Wallet.api_spent)).scalar() or 0.0

            bal_str = f"{int(balance):,}".replace(",", ".") + " đ"
            dep_str = f"{int(total_deposit):,}".replace(",", ".") + " đ"
            cost_str = f"{int(api_spent):,}".replace(",", ".") + " đ"

            # 3. Thống kê Jobs tạo ảnh
            jobs_query = db.query(ImageGenerationJob)
            if scope_user_id:
                jobs_query = jobs_query.filter(ImageGenerationJob.user_id == scope_user_id)

            total_jobs = jobs_query.count()
            successful_jobs = jobs_query.filter(ImageGenerationJob.status == "SUCCEEDED").count()
            failed_jobs = jobs_query.filter(ImageGenerationJob.status == "FAILED").count()
            cached_jobs = jobs_query.filter(ImageGenerationJob.is_cached == True).count()

            # 4. Metric Items
            metrics = [
                MetricItem(
                    id="api_balance",
                    title="Số dư khả dụng" if scope_type == "user" else "Tổng số dư ví",
                    value=bal_str,
                    numeric_value=balance,
                    unit="đ",
                    badge_text="↗ Khả dụng" if scope_type == "user" else "↗ Toàn hệ thống",
                    badge_type="success",
                    icon="wallet"
                ),
                MetricItem(
                    id="total_deposit",
                    title="Tổng tiền nạp",
                    value=dep_str,
                    numeric_value=total_deposit,
                    unit="đ",
                    badge_text="↗ Giao dịch nạp ví",
                    badge_type="success",
                    icon="trending-up"
                ),
                MetricItem(
                    id="api_cost",
                    title="Chi phí API",
                    value=cost_str,
                    numeric_value=api_spent,
                    unit="đ",
                    badge_text=f"↘ {failed_jobs} thất bại" if failed_jobs > 0 else "✓ 0 lỗi phát sinh",
                    badge_type="warning" if failed_jobs > 0 else "success",
                    icon="receipt"
                ),
                MetricItem(
                    id="total_requests",
                    title="Tổng API request",
                    value=str(total_jobs),
                    numeric_value=total_jobs,
                    unit="",
                    badge_text=f"✓ {successful_jobs} thành công ({cached_jobs} cache)" if cached_jobs > 0 else f"✓ {successful_jobs} thành công",
                    badge_type="purple",
                    icon="activity"
                )
            ]

            # 5. Biểu đồ 7 ngày gần nhất (Dữ liệu thật từ database)
            now = datetime.now()
            day_labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
            chart_data = []
            for i in range(6, -1, -1):
                d = (now - timedelta(days=i)).date()
                day_name = day_labels[d.weekday()]
                day_reqs = jobs_query.filter(func.date(ImageGenerationJob.created_at) == d).count()
                day_cost = jobs_query.filter(
                    func.date(ImageGenerationJob.created_at) == d,
                    ImageGenerationJob.status == "SUCCEEDED"
                ).with_entities(func.sum(ImageGenerationJob.charged_customer)).scalar() or 0.0
                chart_data.append(ChartPoint(day=day_name, cost=float(day_cost), requests=int(day_reqs)))

            # 6. Trạng thái API Keys
            keys_query = db.query(ApiKey)
            if scope_user_id:
                keys_query = keys_query.filter(ApiKey.user_id == scope_user_id)
            total_keys = keys_query.count()
            active_keys = keys_query.filter(ApiKey.status == "active").count()
            key_status = ApiKeyStatus(
                total_managed=total_keys,
                active_keys=active_keys,
                other_keys=max(0, total_keys - active_keys)
            )

            # 7. Hoạt động gần đây (Recent Activities từ ImageGenerationJob)
            latest_jobs = jobs_query.order_by(ImageGenerationJob.created_at.desc()).limit(5).all()
            user_ids = list(set([j.user_id for j in latest_jobs if j.user_id]))
            users_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

            recent_activities = []
            for j in latest_jobs:
                u_item = users_map.get(j.user_id)
                u_name = (u_item.full_name or u_item.email) if u_item else "Khách vãng lai"
                m_name = f"{j.model} [⚡ Cache]" if j.is_cached else j.model
                recent_activities.append(
                    ActivityItem(
                        id=j.id,
                        user_name=u_name,
                        model_name=m_name,
                        status="success" if j.status == "SUCCEEDED" else "failed" if j.status == "FAILED" else "pending",
                        cost=f"{int(j.charged_customer):,} đ" if j.status == "SUCCEEDED" else "0 đ",
                        timestamp=j.created_at.strftime("%H:%M:%S %d/%m/%Y")
                    )
                )

            # 8. Tóm tắt vận hành (Operation Summary)
            uptime_val = f"{(successful_jobs / total_jobs * 100):.1f}%" if total_jobs > 0 else "100%"
            operation_summary = OperationSummary(
                active_keys=active_keys,
                synced_keys=active_keys,
                successful_requests=successful_jobs,
                uptime=uptime_val
            )

            # 9. Phân bố Models (Model Distribution)
            model_stats = (
                jobs_query.with_entities(
                    ImageGenerationJob.model,
                    func.count(ImageGenerationJob.id),
                    func.sum(ImageGenerationJob.charged_customer)
                )
                .group_by(ImageGenerationJob.model)
                .all()
            )
            model_distribution = []
            for m_item in model_stats:
                m_name = m_item[0] or "gpt-image-2"
                m_cnt = m_item[1] or 0
                m_cost = m_item[2] or 0.0
                model_distribution.append(
                    ModelDistributionItem(
                        model_id=m_name,
                        model_name=m_name,
                        request_count=m_cnt,
                        cost_amount=f"{int(m_cost):,} đ",
                        badge=m_name[:2].upper()
                    )
                )
            if not model_distribution:
                model_distribution.append(
                    ModelDistributionItem(
                        model_id="gpt-image-2",
                        model_name="gpt-image-2",
                        request_count=0,
                        cost_amount="0 đ",
                        badge="GP"
                    )
                )

            # 10. Danh sách Accounts (Dành riêng cho Admin chọn tài khoản)
            accounts = []
            if is_admin:
                all_users = db.query(User).order_by(User.role.desc(), User.email.asc()).all()
                accounts = [
                    AccountOption(
                        id=u.id,
                        name=u.full_name or u.email,
                        email=u.email,
                        role=u.role
                    )
                    for u in all_users
                ]

            # 11. Date Display tiếng Việt
            weekday_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
            date_display = f"{weekday_names[now.weekday()]}, {now.day} tháng {now.month}, {now.year}"

            return DashboardOverviewResponse(
                date_display=date_display,
                metrics=metrics,
                chart_data=chart_data,
                key_status=key_status,
                recent_activities=recent_activities,
                operation_summary=operation_summary,
                model_distribution=model_distribution,
                scope_type=scope_type,
                scope_user_name=scope_user_name,
                accounts=accounts
            )
        finally:
            if close_session:
                db.close()

dashboard_service = DashboardService()
