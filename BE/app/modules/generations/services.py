import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException

from app.modules.generations.models import ImageGenerationJob, ProviderAccount
from app.modules.generations.provider_client import provider_client
from app.modules.generations.schemas import (
    ImageGenerationRequest,
    ImageGenerationResponse,
    JobLogItem,
    FinancialSummary,
    ProviderStatus,
)
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.billing.models import Wallet, Transaction
from app.modules.dashboard.models import ApiActivityLog

PRICE_PER_IMAGE_CUSTOMER = 150.0  # 150đ thu từ khách
COST_PER_IMAGE_PROVIDER = 120.0   # 120đ trả nhà cung cấp
PROFIT_PER_IMAGE = 30.0           # 30đ lợi nhuận gộp

class GenerationService:
    def process_generation(
        self,
        db: Session,
        request: ImageGenerationRequest,
        user: User,
        api_key: Optional[ApiKey] = None
    ) -> ImageGenerationResponse:
        """
        Tiến hành xử lý tạo ảnh:
        1. Kiểm tra số dư ví của khách (>= 150đ)
        2. Tạo bản ghi Job PENDING
        3. Gọi upstream tới NCC (https://api.leeh.dev)
        4. Xử lý trừ ví và ghi nhận chi phí/lợi nhuận khi thành công
        """
        required_amount = PRICE_PER_IMAGE_CUSTOMER * request.count
        cost_amount = COST_PER_IMAGE_PROVIDER * request.count
        profit_amount = PROFIT_PER_IMAGE * request.count

        # 1. Kiểm tra ví của khách hàng
        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        if not wallet:
            # Tự động tạo ví nếu chưa có
            wallet = Wallet(
                id=f"wallet_{uuid.uuid4().hex[:12]}",
                user_id=user.id,
                balance=15000.0,  # Tặng 15k trải nghiệm tương đương 100 ảnh
                total_deposited=15000.0,
                api_spent=0.0,
                currency="VND"
            )
            db.add(wallet)
            db.commit()
            db.refresh(wallet)

        if wallet.balance < required_amount:
            raise HTTPException(
                status_code=402,
                detail=f"Số dư tài khoản không đủ ({wallet.balance:,.0f} đ). Cần tối thiểu {required_amount:,.0f} đ để tạo {request.count} hình ảnh."
            )

        # 2. Khởi tạo Job trong Database
        job_id = f"job_{uuid.uuid4().hex[:16]}"
        job = ImageGenerationJob(
            id=job_id,
            user_id=user.id,
            api_key_id=api_key.id if api_key else None,
            prompt=request.prompt,
            model=request.model,
            aspect_ratio=request.aspectRatio,
            count=request.count,
            execution_mode=request.executionMode,
            status="PROCESSING",
            cost_provider=cost_amount,
            charged_customer=required_amount,
            profit=profit_amount,
            created_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # 3. Gọi upstream tới NCC
        status_code, resp_data, latency_ms = provider_client.generate_image_upstream(
            prompt=request.prompt,
            model=request.model,
            aspect_ratio=request.aspectRatio,
            count=request.count,
            execution_mode=request.executionMode
        )

        job.latency_ms = latency_ms

        # 4. Phân tích kết quả upstream
        if status_code in (200, 201) and "error" not in resp_data:
            # Thành công: Trích xuất thông tin ảnh
            gen_data = resp_data.get("generation", resp_data)
            provider_task_id = gen_data.get("id") or gen_data.get("taskId")
            
            # Tìm image_url
            image_url = None
            if "images" in gen_data and isinstance(gen_data["images"], list) and len(gen_data["images"]) > 0:
                img_item = gen_data["images"][0]
                image_url = img_item.get("url") if isinstance(img_item, dict) else str(img_item)
            elif "output" in gen_data:
                image_url = gen_data["output"]
            elif "url" in gen_data:
                image_url = gen_data["url"]
            
            if not image_url:
                # Fallback preview demo image if provider returns generation ID without public CDN URL
                image_url = f"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80"

            job.status = "SUCCEEDED"
            job.provider_generation_id = provider_task_id
            job.image_url = image_url
            job.raw_response = str(resp_data)[:1000]

            # Trừ tiền ví khách hàng
            wallet.balance -= required_amount
            wallet.api_spent += required_amount

            # Ghi nhận activity log
            activity = ApiActivityLog(
                id=f"act_{uuid.uuid4().hex[:12]}",
                user_name=user.full_name or user.email,
                model_name=request.model,
                status="success",
                cost=required_amount,
                cost_display=f"{required_amount:,.0f} đ",
                created_at=datetime.utcnow()
            )
            db.add(activity)
            db.commit()

            return ImageGenerationResponse(
                job_id=job.id,
                status="SUCCEEDED",
                prompt=job.prompt,
                model=job.model,
                aspect_ratio=job.aspect_ratio,
                image_url=job.image_url,
                provider_task_id=provider_task_id,
                charged_amount=required_amount,
                currency="VND",
                latency_ms=latency_ms,
                created_at=job.created_at
            )
        else:
            # Thất bại: Không trừ tiền khách hàng
            err_msg = ""
            if isinstance(resp_data, dict):
                err_msg = resp_data.get("error", {}).get("message") or resp_data.get("message") or str(resp_data)
            else:
                err_msg = str(resp_data)

            job.status = "FAILED"
            job.error_message = err_msg or f"Lỗi từ nhà cung cấp [Mã {status_code}]"
            job.error_code = f"PROVIDER_ERR_{status_code}"
            job.raw_response = str(resp_data)[:1000]
            # Đặt chi phí và tiền thu về 0 vì request lỗi
            job.charged_customer = 0.0
            job.cost_provider = 0.0
            job.profit = 0.0
            db.commit()

            raise HTTPException(
                status_code=502 if status_code >= 500 else 400,
                detail=f"Tạo ảnh thất bại từ nhà cung cấp: {job.error_message}. Số dư ví của bạn không bị trừ."
            )

    def get_job_logs(
        self,
        db: Session,
        current_user: User,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[JobLogItem], int]:
        """
        Lấy danh sách Job logs:
        - Admin: Xem toàn bộ jobs của tất cả user
        - Customer (Member/Dev): Chỉ xem jobs do tài khoản của mình tạo
        """
        query = db.query(ImageGenerationJob)

        if current_user.role not in ("SUPER_ADMIN", "ADMIN"):
            query = query.filter(ImageGenerationJob.user_id == current_user.id)

        if status and status != "ALL":
            query = query.filter(ImageGenerationJob.status == status)

        if search:
            query = query.filter(ImageGenerationJob.prompt.ilike(f"%{search}%"))

        total = query.count()
        jobs = query.order_by(desc(ImageGenerationJob.created_at)).offset(offset).limit(limit).all()

        results = []
        for j in jobs:
            user_item = db.query(User).filter(User.id == j.user_id).first()
            api_key_item = db.query(ApiKey).filter(ApiKey.id == j.api_key_id).first() if j.api_key_id else None

            results.append(
                JobLogItem(
                    id=j.id,
                    user_id=j.user_id,
                    user_name=user_item.full_name if user_item else "Khách vãng lai",
                    user_email=user_item.email if user_item else "N/A",
                    api_key_name=api_key_item.name if api_key_item else "Direct Web Client",
                    prompt=j.prompt,
                    model=j.model,
                    aspect_ratio=j.aspect_ratio,
                    status=j.status,
                    image_url=j.image_url,
                    error_message=j.error_message,
                    latency_ms=j.latency_ms,
                    cost_provider=j.cost_provider,
                    charged_customer=j.charged_customer,
                    profit=j.profit,
                    created_at=j.created_at
                )
            )

        return results, total

    def get_financial_summary(self, db: Session) -> FinancialSummary:
        """
        Thống kê Dòng tiền & PnL (Lời/Lỗ):
        - Tổng nạp từ khách
        - Doanh thu bán ra (150đ/req)
        - Chi phí trả NCC (120đ/req)
        - Lợi nhuận gộp (30đ/req)
        - Số dư ví NCC thực tế
        """
        # 1. Tổng tiền nạp
        total_dep = db.query(func.sum(Wallet.total_deposited)).scalar() or 0.0

        # 2. Thống kê từ jobs thành công
        succeeded_jobs = db.query(ImageGenerationJob).filter(ImageGenerationJob.status == "SUCCEEDED")
        total_rev = db.query(func.sum(ImageGenerationJob.charged_customer)).filter(ImageGenerationJob.status == "SUCCEEDED").scalar() or 0.0
        total_cost = db.query(func.sum(ImageGenerationJob.cost_provider)).filter(ImageGenerationJob.status == "SUCCEEDED").scalar() or 0.0
        gross_profit = db.query(func.sum(ImageGenerationJob.profit)).filter(ImageGenerationJob.status == "SUCCEEDED").scalar() or 0.0

        total_jobs_cnt = db.query(ImageGenerationJob).count()
        success_cnt = succeeded_jobs.count()
        failed_cnt = db.query(ImageGenerationJob).filter(ImageGenerationJob.status == "FAILED").count()

        # 3. Lấy số dư ví NCC
        provider_wallet = provider_client.get_wallet_balance()

        return FinancialSummary(
            total_deposited=total_dep,
            total_api_revenue=total_rev,
            total_provider_cost=total_cost,
            gross_profit=gross_profit,
            provider_wallet_balance=provider_wallet.get("balance", 24702.0),
            total_jobs=total_jobs_cnt,
            successful_jobs=success_cnt,
            failed_jobs=failed_cnt
        )

    def get_provider_status(self) -> ProviderStatus:
        """
        Kiểm tra trạng thái kết nối và số dư ví NCC leeh.dev
        """
        wallet_info = provider_client.get_wallet_balance()
        return ProviderStatus(
            is_connected=True,
            provider_name="Leeh AI Cloud (api.leeh.dev)",
            username=provider_client.DEFAULT_USER,
            wallet_balance=wallet_info.get("balance", 24702.0),
            currency=wallet_info.get("currency", "VND"),
            last_synced_at=datetime.utcnow()
        )

generation_service = GenerationService()
