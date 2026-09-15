import json
import uuid
import time
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException
from app.core.config import settings

def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

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

# Default fallback constants (New Provider Rate: 75đ vốn, 150đ bán, 75đ lãi 50%)
PRICE_PER_IMAGE_CUSTOMER = 150.0  # 150đ thu từ khách
COST_PER_IMAGE_PROVIDER = 75.0    # 75đ trả nhà cung cấp mới (gpt-image-2.5) hoặc 70đ (gpt-image-2)
PROFIT_PER_IMAGE = 75.0           # 75đ lợi nhuận gộp (50% biên lãi)

class GenerationService:
    _cached_provider_status: Optional[ProviderStatus] = None
    _provider_status_time: float = 0.0

    @staticmethod
    def _format_job_image_url(job_id: str, raw_url: Optional[str]) -> Optional[str]:
        if not raw_url:
            return None
        # Mọi URL ảnh gửi cho khách đều qua proxy endpoint nội bộ để che giấu 100% CDN/Domain của NCC
        return f"/api/v1/generations/jobs/{job_id}/image"

    def _run_async_generation(
        self,
        job_id: str,
        user_id: str,
        api_key_id: Optional[str],
        request: ImageGenerationRequest,
        mapped_ar: str,
        mapped_res: str,
        mapped_qual: str,
        ref_list: List[str],
        cache_key: str,
        required_amount: float,
        cost_amount: float,
        profit_amount: float,
        user_provider_key: Optional[str]
    ):
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            job = db.query(ImageGenerationJob).filter(ImageGenerationJob.id == job_id).first()
            if not job:
                return
            user = db.query(User).filter(User.id == user_id).first()
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()

            status_code, resp_data, latency_ms = provider_client.generate_image_upstream(
                prompt=request.prompt,
                model=request.model,
                aspect_ratio=mapped_ar,
                resolution=mapped_res,
                quality=mapped_qual,
                reference=job.reference,
                references=ref_list if ref_list else None,
                count=request.count,
                execution_mode="sync",
                provider_key=user_provider_key
            )
            job.latency_ms = latency_ms

            if status_code in (200, 201) and "error" not in resp_data:
                gen_data = resp_data.get("generation", resp_data)
                provider_task_id = gen_data.get("id") or gen_data.get("taskId") or f"task_{uuid.uuid4().hex[:12]}"

                image_url = None
                # Chuẩn OpenAI (data[0].url / data[0].b64_json)
                if "data" in resp_data and isinstance(resp_data["data"], list) and len(resp_data["data"]) > 0:
                    img_item = resp_data["data"][0]
                    image_url = (img_item.get("url") or img_item.get("b64_json")) if isinstance(img_item, dict) else str(img_item)
                elif "images" in resp_data and isinstance(resp_data["images"], list) and len(resp_data["images"]) > 0:
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

                if image_url and image_url.startswith("data:image/"):
                    try:
                        gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
                        os.makedirs(gen_dir, exist_ok=True)
                        header, b64_part = image_url.split(",", 1)
                        mime = header.split(";")[0].replace("data:", "")
                        ext = ".png" if "png" in mime else (".webp" if "webp" in mime else ".jpg")
                        saved_filename = f"{job.id}{ext}"
                        saved_path = os.path.join(gen_dir, saved_filename)
                        with open(saved_path, "wb") as f_b64:
                            f_b64.write(base64.b64decode(b64_part))
                        image_url = f"/static/uploads/generated/{saved_filename}"
                    except Exception as save_err:
                        print(f"[GenerationService] Warning saving base64 image: {save_err}")
                elif image_url and (image_url.startswith("http://") or image_url.startswith("https://")):
                    try:
                        import urllib.request
                        import ssl
                        ctx = ssl.create_default_context()
                        ctx.check_hostname = False
                        ctx.verify_mode = ssl.CERT_NONE
                        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(req, context=ctx, timeout=20) as uresp:
                            data = uresp.read()
                            if data:
                                gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
                                os.makedirs(gen_dir, exist_ok=True)
                                ctype = uresp.headers.get_content_type() or "image/png"
                                ext = ".png" if "png" in ctype else (".webp" if "webp" in ctype else ".jpg")
                                saved_filename = f"{job.id}{ext}"
                                saved_path = os.path.join(gen_dir, saved_filename)
                                with open(saved_path, "wb") as f_img:
                                    f_img.write(data)
                                image_url = f"/static/uploads/generated/{saved_filename}"
                    except Exception as dl_err:
                        print(f"[GenerationService] Warning caching remote async image: {dl_err}")

                if not image_url:
                    image_url = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80"

                # Trích xuất usage tokens
                usage = resp_data.get("usage", {})
                total_tokens = 1650
                if isinstance(usage, dict):
                    total_tokens = usage.get("total_tokens", 1650)

                job.status = "SUCCEEDED"
                job.provider_generation_id = provider_task_id
                job.provider_task_id = provider_task_id
                job.image_url = image_url
                job.total_tokens = total_tokens
                job.cost_provider = cost_amount
                job.charged_customer = required_amount
                job.profit = profit_amount
                job.raw_response = str(resp_data)[:1000]

                if wallet:
                    wallet.balance -= required_amount
                    wallet.api_spent += required_amount

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

                if user:
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
                print(f"[AsyncGeneration] Job {job_id} hoàn tất thành công ({latency_ms}ms)!")
            else:
                err_msg = ""
                if isinstance(resp_data, dict):
                    err_msg = resp_data.get("error", {}).get("message") or resp_data.get("message") or str(resp_data)
                else:
                    err_msg = str(resp_data)

                from app.core.sanitizer import scrub_upstream_leakage
                clean_err = scrub_upstream_leakage(err_msg)

                job.status = "FAILED"
                job.error_message = clean_err or f"Lỗi hệ thống [Mã {status_code}]"
                job.error_code = f"PROVIDER_ERR_{status_code}"
                job.raw_response = str(resp_data)[:1000]
                job.charged_customer = 0.0
                job.cost_provider = 0.0
                job.profit = 0.0
                db.commit()
                print(f"[AsyncGeneration] Job {job_id} thất bại: {job.error_message}")
        except Exception as e:
            print(f"[AsyncGeneration] Lỗi ngoại lệ trong background generation: {e}")
            try:
                job = db.query(ImageGenerationJob).filter(ImageGenerationJob.id == job_id).first()
                if job:
                    job.status = "FAILED"
                    job.error_message = f"Lỗi hệ thống khi xử lý: {str(e)}"
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()

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
        # 0. Chuẩn hóa tên model về Model chuẩn của hệ thống (chống chèn model rác)
        request.model = provider_client.normalize_model(request.model)

        # 0A. Kiểm tra Chế Độ Bảo Trì Toàn Hệ Thống (API Maintenance Mode)
        from app.modules.dashboard.services import dashboard_service
        m_info = dashboard_service.get_maintenance_mode(db)
        if m_info.get("is_maintenance"):
            try:
                from app.modules.dashboard.models import ApiActivityLog
                log_entry = ApiActivityLog(
                    user_name=user.full_name or user.email,
                    model_name=f"{request.model} [Bảo Trì]",
                    status="maintenance",
                    cost=0.0,
                    cost_display="0 đ",
                    created_at=datetime.utcnow()
                )
                db.add(log_entry)
                db.commit()
            except Exception:
                pass

            raise HTTPException(
                status_code=503,
                detail=m_info.get("message") or "Hệ thống API đang trong thời gian bảo trì nâng cấp định kỳ. Yêu cầu của bạn đã bị từ chối an toàn và tài khoản KHÔNG bị trừ tiền. Vui lòng tạm ngừng gửi yêu cầu từ bot/tool/script tự động và thử lại sau ít phút."
            )

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
        
        # Chuẩn hóa số lượng ảnh (ưu tiên n của chuẩn OpenAI)
        if getattr(request, 'n', None) is not None and request.n > 0:
            request.count = request.n

        # Chuẩn hóa resolution và aspectRatio (ưu tiên size theo chuẩn OpenAI)
        ar_input = getattr(request, 'size', None) or request.aspect_ratio or request.aspectRatio or "1024x1024"
        mapped_ar, mapped_res = provider_client.normalize_resolution_and_aspect_ratio(
            ar_input, request.resolution or "1k"
        )
        mapped_qual = provider_client.normalize_quality(getattr(request, 'quality', 'medium'))
        
        # Chuẩn hóa reference / references / sourceImages
        ref_list = []
        if getattr(request, 'sourceImages', None) and isinstance(request.sourceImages, list):
            ref_list.extend([str(r).strip() for r in request.sourceImages if r and str(r).strip()])
        if getattr(request, 'source_images', None) and isinstance(request.source_images, list):
            ref_list.extend([str(r).strip() for r in request.source_images if r and str(r).strip()])
        if request.references and isinstance(request.references, list):
            ref_list.extend([str(r).strip() for r in request.references if r and str(r).strip()])
        if request.reference and isinstance(request.reference, str) and request.reference.strip() and request.reference.strip() not in ref_list:
            ref_list.append(request.reference.strip())
        
        # Nếu có ảnh tham chiếu (Image-to-Image), bỏ qua cache để luôn sinh ảnh mới theo ảnh mẫu của khách
        if ref_list:
            request.no_cache = True
        
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

                formatted_cached_url = self._format_job_image_url(cached_job.id, cached_job.image_url)
                cached_created_ts = int(cached_job.created_at.timestamp()) if cached_job.created_at else int(time.time())
                cached_openai_data = [{"url": formatted_cached_url, "revised_prompt": cached_job.prompt}] if formatted_cached_url else []

                return ImageGenerationResponse(
                    job_id=cached_job.id,
                    status="SUCCEEDED",
                    prompt=cached_job.prompt,
                    model=cached_job.model,
                    aspect_ratio=cached_job.aspect_ratio,
                    resolution=cached_job.resolution or "1k",
                    quality=cached_job.quality or "medium",
                    reference=cached_job.reference,
                    references=ref_list if ref_list else None,
                    image_url=formatted_cached_url,
                    provider_task_id=cached_job.provider_task_id,
                    charged_amount=required_amount,
                    currency="VND",
                    latency_ms=cached_job.latency_ms,
                    is_cached=True,
                    created_at=to_utc(cached_job.created_at),
                    created=cached_created_ts,
                    data=cached_openai_data,
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

        # 3. Gọi upstream tới NCC (sử dụng Provider Key riêng của User nếu có, ngược lại dùng System Master Key)
        user_provider_key = user.provider_api_key if user and user.provider_api_key else None

        # 3. Nếu là chế độ async (bất đồng bộ): kích hoạt chạy ngầm và phản hồi tức thì về client để đóng modal & load bảng
        if request.executionMode == "async":
            import threading
            thread = threading.Thread(
                target=self._run_async_generation,
                args=(
                    job.id,
                    user.id,
                    api_key.id if api_key else None,
                    request,
                    mapped_ar,
                    mapped_res,
                    mapped_qual,
                    ref_list,
                    cache_key,
                    required_amount,
                    cost_amount,
                    profit_amount,
                    user_provider_key
                ),
                daemon=True
            )
            thread.start()

            return ImageGenerationResponse(
                job_id=job.id,
                status="PROCESSING",
                prompt=job.prompt,
                model=job.model,
                aspect_ratio=job.aspect_ratio,
                resolution=job.resolution or "1k",
                quality=job.quality or "medium",
                reference=job.reference,
                references=ref_list if ref_list else None,
                image_url=None,
                provider_task_id=None,
                charged_amount=required_amount,
                currency="VND",
                latency_ms=0,
                is_cached=False,
                created_at=to_utc(job.created_at),
                error_message=None
            )

        status_code, resp_data, latency_ms = provider_client.generate_image_upstream(
            prompt=request.prompt,
            model=request.model,
            aspect_ratio=mapped_ar,
            resolution=mapped_res,
            quality=mapped_qual,
            reference=job.reference,
            references=ref_list if ref_list else None,
            count=request.count,
            execution_mode=request.executionMode,
            provider_key=user_provider_key
        )

        job.latency_ms = latency_ms


        # 4. Phân tích kết quả upstream
        if status_code in (200, 201) and "error" not in resp_data:
            # Thành công: Trích xuất thông tin ảnh
            gen_data = resp_data.get("generation", resp_data)
            provider_task_id = gen_data.get("id") or gen_data.get("taskId") or f"task_{uuid.uuid4().hex[:12]}"
            
            # Tìm image_url
            image_url = None
            # Chuẩn OpenAI (data[0].url / data[0].b64_json)
            if "data" in resp_data and isinstance(resp_data["data"], list) and len(resp_data["data"]) > 0:
                img_item = resp_data["data"][0]
                image_url = (img_item.get("url") or img_item.get("b64_json")) if isinstance(img_item, dict) else str(img_item)
            elif "images" in resp_data and isinstance(resp_data["images"], list) and len(resp_data["images"]) > 0:
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
            
            if image_url and image_url.startswith("data:image/"):
                try:
                    gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
                    os.makedirs(gen_dir, exist_ok=True)
                    header, b64_part = image_url.split(",", 1)
                    mime = header.split(";")[0].replace("data:", "")
                    ext = ".png" if "png" in mime else (".webp" if "webp" in mime else ".jpg")
                    saved_filename = f"{job.id}{ext}"
                    saved_path = os.path.join(gen_dir, saved_filename)
                    with open(saved_path, "wb") as f_b64:
                        f_b64.write(base64.b64decode(b64_part))
                    image_url = f"/static/uploads/generated/{saved_filename}"
                except Exception as save_err:
                    print(f"[GenerationService] Warning saving base64 image: {save_err}")
            elif image_url and (image_url.startswith("http://") or image_url.startswith("https://")):
                try:
                    import urllib.request
                    import ssl
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, context=ctx, timeout=20) as uresp:
                        data = uresp.read()
                        if data:
                            gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
                            os.makedirs(gen_dir, exist_ok=True)
                            ctype = uresp.headers.get_content_type() or "image/png"
                            ext = ".png" if "png" in ctype else (".webp" if "webp" in ctype else ".jpg")
                            saved_filename = f"{job.id}{ext}"
                            saved_path = os.path.join(gen_dir, saved_filename)
                            with open(saved_path, "wb") as f_img:
                                f_img.write(data)
                            image_url = f"/static/uploads/generated/{saved_filename}"
                except Exception as dl_err:
                    print(f"[GenerationService] Warning caching remote sync image: {dl_err}")

            if not image_url:
                # Fallback preview demo image if provider returns generation ID without public CDN URL
                image_url = f"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80"

            # Trích xuất usage tokens
            usage = resp_data.get("usage", {})
            total_tokens = 1650
            if isinstance(usage, dict):
                total_tokens = usage.get("total_tokens", 1650)

            job.status = "SUCCEEDED"
            job.provider_generation_id = provider_task_id
            job.provider_task_id = provider_task_id
            job.image_url = image_url
            job.total_tokens = total_tokens
            job.cost_provider = cost_amount
            job.charged_customer = required_amount
            job.profit = profit_amount
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

            formatted_result_url = self._format_job_image_url(job.id, job.image_url)
            result_created_ts = int(job.created_at.timestamp()) if job.created_at else int(time.time())
            result_openai_data = [{"url": formatted_result_url, "revised_prompt": job.prompt}] if formatted_result_url else []

            return ImageGenerationResponse(
                job_id=job.id,
                status="SUCCEEDED",
                prompt=job.prompt,
                model=job.model,
                aspect_ratio=job.aspect_ratio,
                resolution=job.resolution or "1k",
                quality=job.quality or "medium",
                reference=job.reference,
                references=ref_list if ref_list else None,
                image_url=formatted_result_url,
                provider_task_id=None,
                charged_amount=required_amount,
                currency="VND",
                latency_ms=latency_ms,
                created_at=to_utc(job.created_at),
                created=result_created_ts,
                data=result_openai_data
            )
        else:
            # Thất bại: Không trừ tiền khách hàng
            err_msg = ""
            if isinstance(resp_data, dict):
                err_msg = resp_data.get("error", {}).get("message") or resp_data.get("message") or str(resp_data)
            else:
                err_msg = str(resp_data)

            from app.core.sanitizer import scrub_upstream_leakage
            clean_err = scrub_upstream_leakage(err_msg)

            job.status = "FAILED"
            job.error_message = clean_err or f"Lỗi hệ thống [Mã {status_code}]"
            job.error_code = f"PROVIDER_ERR_{status_code}"
            job.raw_response = str(resp_data)[:1000]
            # Đặt chi phí và tiền thu về 0 vì request lỗi
            job.charged_customer = 0.0
            job.cost_provider = 0.0
            job.profit = 0.0
            db.commit()

            raise HTTPException(
                status_code=502 if status_code >= 500 else 400,
                detail=f"Tạo ảnh không thành công: {job.error_message}. Số dư ví của bạn không bị trừ."
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

            token_in = 0
            token_out = 0
            if j.status != "FAILED":
                try:
                    if j.raw_response and "usage" in j.raw_response:
                        import ast
                        raw_dict = json.loads(j.raw_response) if j.raw_response.startswith("{") else ast.literal_eval(j.raw_response)
                        u = raw_dict.get("usage", {})
                        token_in = u.get("input_tokens", 0)
                        token_out = u.get("output_tokens", 0)
                except Exception:
                    pass
                if token_in == 0 and token_out == 0:
                    tot = getattr(j, 'total_tokens', None) or 1650
                    token_out = 1650
                    token_in = max(1, tot - 1650) if tot > 1650 else max(1, len(j.prompt or "") // 3)

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
                    quality=j.quality or "medium",
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
                    created_at=to_utc(j.created_at)
                )
            )

        return results, total, user_stats

    def get_financial_summary(self, db: Session) -> FinancialSummary:
        """
        Thống kê Dòng tiền & PnL (Lời/Lỗ):
        - Tổng nạp từ khách
        - Doanh thu bán ra (150đ/req)
        - Chi phí trả NCC (75đ/req)
        - Lợi nhuận gộp (75đ/req, biên lãi 50%)
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
        balance_val = float(wallet_info.get("balance", 0.0))
        is_low = bool(wallet_info.get("low_balance_warning", balance_val < 5000.0))

        status = ProviderStatus(
            is_connected=True,
            provider_name=getattr(settings, "UPSTREAM_PROVIDER_NAME", "Xompet AI Gateway"),
            username="xompet-master-key",
            wallet_balance=balance_val,
            currency=wallet_info.get("currency", "đ"),
            last_synced_at=datetime.now(),
            low_balance_warning=is_low,
            budget_total=float(wallet_info.get("budget_total", 100000.0)),
            budget_used=float(wallet_info.get("budget_used", 0.0)),
            budget_remaining=float(wallet_info.get("budget_remaining", balance_val)),
            used_percent=float(wallet_info.get("used_percent", 0.0)),
            key_masked=wallet_info.get("key_masked", "sk-9r-N1...zz"),
            status_text=wallet_info.get("status_text", "Bình thường"),
            models_rates=wallet_info.get("models_rates")
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
            quality=job.quality or "medium",
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
