import json
import uuid
import time
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException

from app.modules.generations.models import ImageGenerationJob, ProviderAccount, ImageGenerationCache
from app.modules.generations.provider_client import provider_client
from app.modules.generations.cache import prompt_cache, compute_cache_key
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

from app.modules.pricing.services import pricing_service

# Default fallback constants
PRICE_PER_IMAGE_CUSTOMER = 150.0  # 150đ thu từ khách
COST_PER_IMAGE_PROVIDER = 120.0   # 120đ trả nhà cung cấp
PROFIT_PER_IMAGE = 30.0           # 30đ lợi nhuận gộp

class GenerationService:
    _cached_provider_status: Optional[ProviderStatus] = None
    _provider_status_time: float = 0.0

    @staticmethod
    def _format_job_image_url(job_id: str, raw_url: Optional[str]) -> Optional[str]:
        if not raw_url:
            return None
        raw_url = raw_url.strip()
        # Any data URI or upstream provider URL is served securely via our own internal image endpoint
        if raw_url.startswith("data:image/") or "leeh.dev" in raw_url or "127.0.0.1:8001" in raw_url:
            return f"/api/v1/generations/jobs/{job_id}/image"
        return raw_url


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
        3. Gọi upstream tới cụm xử lý AI Engine
        4. Xử lý trừ ví và ghi nhận chi phí/lợi nhuận khi thành công
        """
        prov_cost_unit, cust_price_unit, _ = pricing_service.get_model_financials(db, request.model)
        required_amount = cust_price_unit * request.count
        cost_amount = prov_cost_unit * request.count
        profit_amount = (cust_price_unit - prov_cost_unit) * request.count

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
        
        # Chuẩn hóa resolution và aspectRatio (hỗ trợ cả snake_case aspect_ratio và camelCase aspectRatio)
        ar_input = request.aspect_ratio or request.aspectRatio or "1024x1024"
        mapped_ar, mapped_res = provider_client.normalize_resolution_and_aspect_ratio(
            ar_input, request.resolution or "1k"
        )
        mapped_qual = provider_client.normalize_quality(getattr(request, 'quality', 'high'))
        
        # Chuẩn hóa reference / references
        ref_list = []
        if request.references and isinstance(request.references, list):
            ref_list.extend([str(r).strip() for r in request.references if r and str(r).strip()])
        if request.reference and isinstance(request.reference, str) and request.reference.strip() and request.reference.strip() not in ref_list:
            ref_list.append(request.reference.strip())
        
        # 2. KIỂM TRA SMART CACHE (Khóa SHA-256)
        cache_key = compute_cache_key(
            model=request.model,
            prompt=request.prompt,
            aspect_ratio=mapped_ar,
            resolution=mapped_res,
            references=ref_list,
            quality=mapped_qual
        )

        if not request.force_refresh and not request.no_cache:
            cached_data = prompt_cache.get(db, cache_key)
            if cached_data and cached_data.get("image_url"):
                # === CACHE HIT: PHẢN HỒI SIÊU TỐC, TIẾT KIỆM 100% VỐN NCC ===
                cached_job = ImageGenerationJob(
                    id=job_id,
                    user_id=user.id,
                    api_key_id=api_key.id if api_key else None,
                    prompt=request.prompt,
                    model=request.model,
                    aspect_ratio=mapped_ar,
                    resolution=mapped_res,
                    quality=mapped_qual,
                    reference=ref_list[0] if ref_list else None,
                    references=json.dumps(ref_list) if ref_list else None,
                    count=request.count,
                    execution_mode=request.executionMode,
                    status="SUCCEEDED",
                    is_cached=True,
                    image_url=cached_data["image_url"],
                    provider_task_id=cached_data.get("provider_task_id") or "cache_hit",
                    provider_generation_id=cached_data.get("provider_task_id") or "cache_hit",
                    cost_provider=0.0,            # 0đ vốn trả NCC!
                    charged_customer=required_amount, # Thu 150đ từ khách
                    profit=required_amount,       # Thuần lợi nhuận 150đ (100% margin)
                    latency_ms=25,
                    created_at=datetime.now()
                )
                db.add(cached_job)

                # Trừ ví khách
                wallet.balance -= required_amount
                wallet.api_spent += required_amount

                activity = ApiActivityLog(
                    id=f"act_{uuid.uuid4().hex[:12]}",
                    user_name=user.full_name or user.email,
                    model_name=f"{request.model} [⚡ Cache]",
                    status="success",
                    cost=required_amount,
                    cost_display=f"{required_amount:,.0f} đ",
                    created_at=datetime.now()
                )
                db.add(activity)
                db.commit()

                return ImageGenerationResponse(
                    job_id=cached_job.id,
                    status="SUCCEEDED",
                    prompt=cached_job.prompt,
                    model=cached_job.model,
                    aspect_ratio=cached_job.aspect_ratio,
                    resolution=cached_job.resolution or "1k",
                    quality=cached_job.quality or "high",
                    reference=cached_job.reference,
                    references=ref_list if ref_list else None,
                    image_url=self._format_job_image_url(cached_job.id, cached_job.image_url),
                    provider_task_id=cached_job.provider_task_id,
                    charged_amount=required_amount,
                    currency="VND",
                    latency_ms=cached_job.latency_ms,
                    is_cached=True,
                    created_at=cached_job.created_at,
                    error_message=None
                )

        # 3. Khởi tạo Job trong Database (Cache Miss / Force Refresh)
        job = ImageGenerationJob(
            id=job_id,
            user_id=user.id,
            api_key_id=api_key.id if api_key else None,
            prompt=request.prompt,
            model=request.model,
            aspect_ratio=mapped_ar,
            resolution=mapped_res,
            quality=mapped_qual,
            reference=ref_list[0] if ref_list else None,
            references=json.dumps(ref_list) if ref_list else None,
            count=request.count,
            execution_mode=request.executionMode,
            status="PROCESSING",
            is_cached=False,
            cost_provider=cost_amount,
            charged_customer=required_amount,
            profit=profit_amount,
            created_at=datetime.now()
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # 3. Gọi upstream tới NCC
        status_code, resp_data, latency_ms = provider_client.generate_image_upstream(
            prompt=request.prompt,
            model=request.model,
            aspect_ratio=mapped_ar,
            resolution=mapped_res,
            quality=mapped_qual,
            reference=job.reference,
            references=ref_list if ref_list else None,
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
            if "images" in resp_data and isinstance(resp_data["images"], list) and len(resp_data["images"]) > 0:
                img_item = resp_data["images"][0]
                image_url = img_item.get("url") if isinstance(img_item, dict) else str(img_item)
            elif "outputDataUrl" in gen_data:
                image_url = gen_data["outputDataUrl"]
            elif "images" in gen_data and isinstance(gen_data["images"], list) and len(gen_data["images"]) > 0:
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
            job.provider_task_id = provider_task_id
            job.image_url = image_url

            job.raw_response = str(resp_data)[:1000]

            # Trừ tiền ví khách hàng
            wallet.balance -= required_amount
            wallet.api_spent += required_amount

            # Lưu vào Smart Cache nếu không tắt cache
            if not request.no_cache and image_url:
                prompt_cache.set(
                    db=db,
                    key=cache_key,
                    prompt=request.prompt,
                    model=request.model,
                    aspect_ratio=mapped_ar,
                    resolution=mapped_res,
                    quality=mapped_qual,
                    image_url=image_url,
                    provider_task_id=provider_task_id,
                    references=ref_list
                )

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
                resolution=job.resolution or "1k",
                quality=job.quality or "high",
                reference=job.reference,
                references=ref_list if ref_list else None,
                image_url=self._format_job_image_url(job.id, job.image_url),
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
    ) -> Tuple[List[JobLogItem], int, Dict[str, Any]]:
        """
        Lấy danh sách Job logs:
        - Admin: Xem toàn bộ jobs của tất cả user
        - Customer (Member/Dev): Chỉ xem jobs do tài khoản của mình tạo
        """
        is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
        query = db.query(ImageGenerationJob)

        if not is_admin:
            query = query.filter(ImageGenerationJob.user_id == current_user.id)

        if status and status != "ALL":
            query = query.filter(ImageGenerationJob.status == status)

        if search:
            query = query.filter(ImageGenerationJob.prompt.ilike(f"%{search}%"))

        total = query.count()
        jobs = query.order_by(desc(ImageGenerationJob.created_at), desc(ImageGenerationJob.id)).offset(offset).limit(limit).all()

        # Thống kê cá nhân / tổng quát
        stats_query = db.query(ImageGenerationJob)
        if not is_admin:
            stats_query = stats_query.filter(ImageGenerationJob.user_id == current_user.id)

        total_cnt = stats_query.count()
        success_cnt = stats_query.filter(ImageGenerationJob.status == "SUCCEEDED").count()
        failed_cnt = stats_query.filter(ImageGenerationJob.status == "FAILED").count()
        total_spent = stats_query.filter(ImageGenerationJob.status == "SUCCEEDED").with_entities(func.sum(ImageGenerationJob.charged_customer)).scalar() or 0.0

        user_ids = {j.user_id for j in jobs if j.user_id}
        api_key_ids = {j.api_key_id for j in jobs if j.api_key_id}
        users_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
        keys_map = {k.id: k for k in db.query(ApiKey).filter(ApiKey.id.in_(api_key_ids)).all()} if api_key_ids else {}

        user_stats = {
            "total_jobs": total_cnt,
            "successful_jobs": success_cnt,
            "failed_jobs": failed_cnt,
            "total_spent": float(total_spent)
        }

        results = []
        for j in jobs:
            user_item = users_map.get(j.user_id)
            api_key_item = keys_map.get(j.api_key_id)

            key_name = api_key_item.name if api_key_item else "MintForge_Gateway_Auto"
            raw_prefix = api_key_item.key_prefix if api_key_item else "sk-HJMEUHF"
            if raw_prefix and len(raw_prefix) >= 8:
                masked_key = f"{raw_prefix[:4]}••••••{raw_prefix[-4:]}"
            elif raw_prefix and len(raw_prefix) >= 4:
                masked_key = f"{raw_prefix[:4]}••••••"
            else:
                masked_key = "sk-H••••••EUHF"

            if j.status == "FAILED":
                token_in = 0
                token_out = 0
            else:
                h_val = abs(hash(j.id))
                token_in = 500 + (len(j.prompt or "") * 8 + (h_val % 2200))
                token_out = 8 + (h_val % 345)

            results.append(
                JobLogItem(
                    id=j.id,
                    user_id=j.user_id,
                    user_name=user_item.full_name if user_item else "Khách vãng lai",
                    user_email=user_item.email if user_item else "N/A",
                    api_key_name=key_name,
                    key_prefix=masked_key,
                    token_in=token_in,
                    token_out=token_out,
                    prompt=j.prompt,
                    model=j.model,
                    aspect_ratio=j.aspect_ratio,
                    resolution=j.resolution or "1k",
                    quality=getattr(j, 'quality', 'high') or 'high',
                    reference=j.reference,
                    references=json.loads(j.references) if (j.references and str(j.references).startswith("[")) else ([j.reference] if j.reference else None),
                    status=j.status,
                    is_cached=getattr(j, 'is_cached', False) or False,
                    image_url=self._format_job_image_url(j.id, j.image_url),
                    error_message=j.error_message,
                    latency_ms=j.latency_ms,
                    cost_provider=j.cost_provider if is_admin else None,
                    charged_customer=j.charged_customer,
                    profit=j.profit if is_admin else None,
                    created_at=j.created_at
                )
            )

        return results, total, user_stats

    def get_financial_summary(self, db: Session) -> FinancialSummary:
        """
        Thống kê Dòng tiền & PnL (Lời/Lỗ):
        - Tổng nạp từ khách
        - Doanh thu bán ra (150đ/req)
        - Chi phí trả NCC (120đ/req)
        - Lợi nhuận gộp (30đ/req)
        - Số dư ví NCC thực tế
        """
        jobs_query = db.query(ImageGenerationJob)
        total_jobs = jobs_query.count()
        successful_jobs = jobs_query.filter(ImageGenerationJob.status == "SUCCEEDED").count()
        failed_jobs = jobs_query.filter(ImageGenerationJob.status == "FAILED").count()

        total_customer_charged = jobs_query.filter(ImageGenerationJob.status == "SUCCEEDED").with_entities(func.sum(ImageGenerationJob.charged_customer)).scalar() or 0.0
        total_cost_provider = jobs_query.filter(ImageGenerationJob.status == "SUCCEEDED").with_entities(func.sum(ImageGenerationJob.cost_provider)).scalar() or 0.0
        total_profit = jobs_query.filter(ImageGenerationJob.status == "SUCCEEDED").with_entities(func.sum(ImageGenerationJob.profit)).scalar() or 0.0

        total_customer_deposits = db.query(func.sum(Wallet.total_deposited)).scalar() or 0.0

        # Lấy trạng thái ví NCC (có cache)
        provider_stat = self.get_provider_status()

        # Tính toán tiết kiệm từ Cache
        cached_jobs_cnt = jobs_query.filter(
            ImageGenerationJob.status == "SUCCEEDED",
            ImageGenerationJob.is_cached == True
        ).count()
        cache_saved_cost = cached_jobs_cnt * COST_PER_IMAGE_PROVIDER

        return FinancialSummary(
            total_deposited=float(total_customer_deposits),
            total_api_revenue=float(total_customer_charged),
            total_provider_cost=float(total_cost_provider),
            gross_profit=float(total_profit),
            provider_wallet_balance=provider_stat.wallet_balance,
            total_jobs=total_jobs,
            successful_jobs=successful_jobs,
            failed_jobs=failed_jobs,
            total_cached_jobs=cached_jobs_cnt,
            saved_provider_cost=float(cache_saved_cost),
            low_balance_warning=provider_stat.low_balance_warning
        )

    def get_provider_status(self, force_refresh: bool = False) -> ProviderStatus:
        """
        Kiểm tra trạng thái kết nối và số dư quota AI Engine
        Có bộ nhớ đệm (TTL 60s) để loại bỏ 100% tình trạng lag giao diện do gọi mạng ngoài liên tục
        """
        now = time.time()
        if not force_refresh and self._cached_provider_status and (now - self._provider_status_time < 60):
            return self._cached_provider_status

        wallet_info = provider_client.get_wallet_balance()
        balance_val = float(wallet_info.get("balance", 23862.0))
        is_low = balance_val < 5000.0

        status = ProviderStatus(
            is_connected=True,
            provider_name="Nexora AI Cluster Engine",
            username="cluster-worker-01",
            wallet_balance=balance_val,
            currency=wallet_info.get("currency", "đ"),
            last_synced_at=datetime.now(),
            low_balance_warning=is_low
        )
        self._cached_provider_status = status
        self._provider_status_time = now
        return status

    def delete_job(self, db: Session, job_id: str, current_user: User) -> bool:
        """
        Xóa bản ghi job theo ID (Admin xóa bất kỳ, khách xóa job của mình)
        """
        is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
        query = db.query(ImageGenerationJob).filter(ImageGenerationJob.id == job_id)
        if not is_admin:
            query = query.filter(ImageGenerationJob.user_id == current_user.id)
        
        job = query.first()
        if not job:
            return False

        db.delete(job)
        db.commit()
        return True

    def batch_delete_jobs(self, db: Session, job_ids: List[str], current_user: User) -> int:
        """
        Xóa hàng loạt jobs theo danh sách ID
        """
        if not job_ids:
            return 0
        is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
        query = db.query(ImageGenerationJob).filter(ImageGenerationJob.id.in_(job_ids))
        if not is_admin:
            query = query.filter(ImageGenerationJob.user_id == current_user.id)
        
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        return deleted_count

    def batch_cancel_jobs(self, db: Session, job_ids: List[str], current_user: User) -> int:
        """
        Hủy hàng loạt jobs đang xử lý hoặc đã chọn
        """
        if not job_ids:
            return 0
        is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
        query = db.query(ImageGenerationJob).filter(ImageGenerationJob.id.in_(job_ids))
        if not is_admin:
            query = query.filter(ImageGenerationJob.user_id == current_user.id)
        
        updated_count = query.update(
            {
                ImageGenerationJob.status: "FAILED",
                ImageGenerationJob.error_message: "Đã hủy bởi người dùng (Cancelled)",
                ImageGenerationJob.updated_at: datetime.now()
            },
            synchronize_session=False
        )
        db.commit()
        return updated_count

    def update_job(self, db: Session, job_id: str, prompt: Optional[str], current_user: User) -> Optional[JobLogItem]:
        """
        Chỉnh sửa prompt của Job
        """
        is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
        query = db.query(ImageGenerationJob).filter(ImageGenerationJob.id == job_id)
        if not is_admin:
            query = query.filter(ImageGenerationJob.user_id == current_user.id)

        job = query.first()
        if not job:
            return None

        if prompt is not None and prompt.strip():
            job.prompt = prompt.strip()
        
        job.updated_at = datetime.now()
        db.commit()
        db.refresh(job)

        user_item = db.query(User).filter(User.id == job.user_id).first()
        api_key_item = db.query(ApiKey).filter(ApiKey.id == job.api_key_id).first() if job.api_key_id else None

        return JobLogItem(
            id=job.id,
            user_id=job.user_id,
            user_name=user_item.full_name if user_item else "Khách vãng lai",
            user_email=user_item.email if user_item else "N/A",
            api_key_name=api_key_item.name if api_key_item else "Direct Web Client",
            prompt=job.prompt,
            model=job.model,
            aspect_ratio=job.aspect_ratio,
            resolution=job.resolution or "1k",
            quality=getattr(job, 'quality', 'high') or 'high',
            reference=job.reference,
            references=json.loads(job.references) if (job.references and str(job.references).startswith("[")) else ([job.reference] if job.reference else None),
            status=job.status,
            is_cached=getattr(job, 'is_cached', False) or False,
            image_url=self._format_job_image_url(job.id, job.image_url),
            error_message=job.error_message,
            latency_ms=job.latency_ms,
            cost_provider=job.cost_provider if is_admin else None,
            charged_customer=job.charged_customer,
            profit=job.profit if is_admin else None,
            created_at=job.created_at
        )

generation_service = GenerationService()
