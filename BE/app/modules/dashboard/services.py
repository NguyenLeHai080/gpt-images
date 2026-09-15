from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.auth.models import User
from app.modules.billing.models import Wallet
from app.modules.api_keys.models import ApiKey
from app.modules.generations.models import ImageGenerationJob
from app.modules.generations.provider_client import provider_client
from app.modules.dashboard.models import ApiActivityLog, SystemSetting
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
            
            scope_user_email = None
            scope_user_role = None
            scope_user_company = None

            if is_admin:
                if target_user_id and target_user_id != "all":
                    target_user = db.query(User).filter(User.id == target_user_id).first()
                    scope_user_id = target_user.id if target_user else None
                    scope_type = "user" if target_user else "all"
                    if target_user:
                        scope_user_name = target_user.full_name or target_user.email
                        scope_user_email = target_user.email
                        scope_user_role = target_user.role
                        scope_user_company = target_user.company_name
                    else:
                        scope_user_name = "Toàn hệ thống"
                else:
                    scope_user_id = None
                    scope_type = "all"
                    scope_user_name = "Toàn hệ thống (Admin)"
            else:
                # User thường: Bắt buộc chỉ load dữ liệu tài khoản của chính mình
                scope_user_id = user.id if user else None
                scope_type = "user"
                if user:
                    scope_user_name = user.full_name or user.email
                    scope_user_email = user.email
                    scope_user_role = user.role
                    scope_user_company = user.company_name
                else:
                    scope_user_name = "Khách Hàng"

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
            avail_imgs = int(balance // 150) if balance >= 0 else 0
            is_exhausted = (scope_type == "user" and balance < 150)

            if scope_type == "user":
                bal_badge = f"Tạo được ~{avail_imgs:,} ảnh" if not is_exhausted else "Hết số dư — Cần nạp thêm"
                bal_badge_type = "success" if not is_exhausted else "danger"
            else:
                bal_badge = "↗ Toàn hệ thống"
                bal_badge_type = "success"

            metrics = [
                MetricItem(
                    id="api_balance",
                    title="Số dư khả dụng" if scope_type == "user" else "Tổng số dư ví",
                    value=bal_str,
                    numeric_value=balance,
                    unit="đ",
                    badge_text=bal_badge,
                    badge_type=bal_badge_type,
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
                    title="Chi phí API" if scope_type == "user" else "Doanh thu API",
                    value=cost_str,
                    numeric_value=api_spent,
                    unit="đ",
                    badge_text=f"↘ {failed_jobs} thất bại" if failed_jobs > 0 else "✓ 0 lỗi phát sinh",
                    badge_type="warning" if failed_jobs > 0 else "success",
                    icon="receipt"
                ),
                MetricItem(
                    id="total_requests",
                    title="Tổng ảnh đã tạo" if scope_type == "user" else "Tổng API request",
                    value=str(total_jobs),
                    numeric_value=total_jobs,
                    unit="",
                    badge_text=f"✓ {successful_jobs} thành công ({cached_jobs} cache)" if cached_jobs > 0 else f"✓ {successful_jobs} thành công",
                    badge_type="purple",
                    icon="activity"
                )
            ]

            # 5. Biểu đồ 7 ngày gần nhất (Dữ liệu thật từ database - single aggregated query)
            now = datetime.now()
            start_date = (now - timedelta(days=6)).date()
            day_labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]

            daily_rows = (
                jobs_query.filter(func.date(ImageGenerationJob.created_at) >= start_date)
                .with_entities(
                    func.date(ImageGenerationJob.created_at).label("d"),
                    func.count(ImageGenerationJob.id).label("reqs"),
                    func.sum(
                        case((ImageGenerationJob.status == "SUCCEEDED", ImageGenerationJob.charged_customer), else_=0.0)
                    ).label("cost")
                )
                .group_by(func.date(ImageGenerationJob.created_at))
                .all()
            )
            stats_by_date = {row.d: (float(row.cost or 0.0), int(row.reqs or 0)) for row in daily_rows}

            chart_data = []
            for i in range(6, -1, -1):
                d = (now - timedelta(days=i)).date()
                day_name = day_labels[d.weekday()]
                cost, reqs = stats_by_date.get(d, (0.0, 0))
                chart_data.append(ChartPoint(day=day_name, cost=cost, requests=reqs))

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
                norm_m = provider_client.normalize_model(j.model)
                m_name = f"{norm_m} [⚡ Cache]" if j.is_cached else norm_m
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
            # Cố định danh mục 4 Model chính thức, tự động ánh xạ và gom nhóm mọi alias từ khách gọi
            CANONICAL_MODELS = [
                {"id": "gpt-image-2.5-flare", "name": "gpt-image-2.5-flare", "badge": "FL"},
                {"id": "gpt-image-2.5-sunburst", "name": "gpt-image-2.5-sunburst", "badge": "SB"},
                {"id": "gpt-image-2", "name": "gpt-image-2", "badge": "G2"},
                {"id": "nanobanana-2", "name": "nanobanana-2", "badge": "NB"},
            ]
            model_agg = {m["id"]: {"count": 0, "cost": 0.0} for m in CANONICAL_MODELS}

            raw_model_stats = (
                jobs_query.with_entities(
                    ImageGenerationJob.model,
                    func.count(ImageGenerationJob.id),
                    func.sum(ImageGenerationJob.charged_customer)
                )
                .group_by(ImageGenerationJob.model)
                .all()
            )
            for m_raw, m_cnt, m_cost in raw_model_stats:
                norm = provider_client.normalize_model(m_raw)
                if norm not in model_agg:
                    norm = "gpt-image-2.5-flare"
                model_agg[norm]["count"] += (m_cnt or 0)
                model_agg[norm]["cost"] += float(m_cost or 0.0)

            model_distribution = [
                ModelDistributionItem(
                    model_id=m["id"],
                    model_name=m["name"],
                    request_count=model_agg[m["id"]]["count"],
                    cost_amount=f"{int(model_agg[m['id']]['cost']):,} đ",
                    badge=m["badge"]
                )
                for m in CANONICAL_MODELS
            ]

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

            prov_balance = (
                float(provider_client.get_wallet_balance().get("balance", 0.0))
                if (is_admin and scope_type == "all")
                else None
            )

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
                scope_user_email=scope_user_email,
                scope_user_role=scope_user_role,
                scope_user_company=scope_user_company,
                accounts=accounts,
                is_exhausted=is_exhausted,
                available_images=avail_imgs,
                user_balance=balance,
                provider_balance=prov_balance
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_maintenance_mode(db: Optional[Session] = None) -> dict:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True
        try:
            setting = db.query(SystemSetting).filter(SystemSetting.key == "api_maintenance_mode").first()
            if not setting:
                return {
                    "is_maintenance": False,
                    "message": "Hệ thống API đang hoạt động bình thường.",
                    "updated_by": "System",
                    "updated_at": None,
                }
            return {
                "is_maintenance": setting.value.lower() == "true",
                "message": setting.message or "Hệ thống API đang trong thời gian bảo trì nâng cấp định kỳ.",
                "updated_by": setting.updated_by,
                "updated_at": setting.updated_at.strftime("%H:%M:%S %d/%m/%Y") if setting.updated_at else None,
            }
        finally:
            if close_session:
                db.close()

    @staticmethod
    def set_maintenance_mode(db: Session, enabled: bool, message: Optional[str], user: Optional[User] = None) -> dict:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "api_maintenance_mode").first()
        val_str = "true" if enabled else "false"
        default_msg = (
            "Hệ thống API đang trong thời gian bảo trì nâng cấp định kỳ. "
            "Yêu cầu tạo ảnh tạm ngưng nhận lệnh để bảo vệ số dư ví của khách. "
            "Vui lòng tạm dừng bot/tool/script tự động và thử lại sau ít phút."
        )
        msg_str = message or default_msg
        updater = (user.full_name or user.email) if user else "Super Admin"

        if not setting:
            setting = SystemSetting(
                key="api_maintenance_mode",
                value=val_str,
                message=msg_str,
                updated_by=updater,
                updated_at=datetime.utcnow()
            )
            db.add(setting)
        else:
            setting.value = val_str
            setting.message = msg_str
            setting.updated_by = updater
            setting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(setting)

        return {
            "is_maintenance": enabled,
            "message": setting.message,
            "updated_by": setting.updated_by,
            "updated_at": setting.updated_at.strftime("%H:%M:%S %d/%m/%Y"),
        }

dashboard_service = DashboardService()

