import os
import time
import json
import base64
import hashlib
import urllib.request
import requests
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image
import io
from app.core.config import settings

class ProviderClient:
    """
    Client kết nối trực tiếp tới Cụm AI Provider mới (Xompet / Cunai OpenAI-compatible Gateway)
    Hỗ trợ sinh ảnh mới (/v1/images/generations) và sửa ảnh / Image-to-Image (/v1/images/edits).
    """

    def __init__(self):
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        self.timeout = 900  # 15 phút tối đa
        self.is_quota_exhausted = False
        self.custom_budget_total: Optional[float] = None
        self._cached_wallet: Optional[Dict[str, Any]] = None
        self._wallet_cached_time: float = 0.0

    def get_configured_budget_total(self) -> float:
        """
        Lấy tổng ngân sách NCC đã nạp. Ưu tiên lấy từ bản ghi ProviderBudgetLog mới nhất nếu có.
        """
        if self.custom_budget_total and self.custom_budget_total > 0:
            return float(self.custom_budget_total)
        try:
            from app.core.database import SessionLocal
            from app.modules.billing.models import ProviderBudgetLog
            db = SessionLocal()
            try:
                latest = db.query(ProviderBudgetLog).order_by(ProviderBudgetLog.created_at.desc()).first()
                if latest and latest.budget_after and latest.budget_after > 0:
                    self.custom_budget_total = float(latest.budget_after)
                    return float(latest.budget_after)
            finally:
                db.close()
        except Exception:
            pass
        return 0.0

    @property
    def base_url(self) -> str:
        url = getattr(settings, "UPSTREAM_PROVIDER_URL", "").rstrip("/")
        if not url:
            try:
                from app.core.database import SessionLocal
                from app.modules.providers.models import AIProvider
                db = SessionLocal()
                try:
                    p = db.query(AIProvider).filter(AIProvider.is_primary == True, AIProvider.is_active == True).first()
                    if p and p.base_url:
                        url = p.base_url.rstrip("/")
                        settings.UPSTREAM_PROVIDER_URL = url
                finally:
                    db.close()
            except Exception:
                pass
        return url

    @property
    def raw_api_key(self) -> str:
        key = getattr(settings, "UPSTREAM_PROVIDER_KEY", "")
        if not key:
            try:
                from app.core.database import SessionLocal
                from app.modules.providers.models import AIProvider
                db = SessionLocal()
                try:
                    p = db.query(AIProvider).filter(AIProvider.is_primary == True, AIProvider.is_active == True).first()
                    if p and p.api_key:
                        key = p.api_key
                        settings.UPSTREAM_PROVIDER_KEY = key
                        settings.UPSTREAM_PROVIDER_NAME = p.name
                finally:
                    db.close()
            except Exception:
                pass
        return key

    @property
    def default_model(self) -> str:
        return getattr(settings, "UPSTREAM_DEFAULT_IMAGE_MODEL", "gpt-image-2.5-flare")

    def _build_url(self, endpoint: str, base_url: Optional[str] = None) -> str:
        base = (base_url or self.base_url or "").strip()
        if not base:
            return endpoint
        ep = endpoint.strip()
        if not ep.startswith("/"):
            ep = "/" + ep
        if base.endswith("/v1") and ep.startswith("/v1/"):
            ep = ep[3:]
        return f"{base}{ep}"

    def get_cached_wallet_balance(self) -> Dict[str, Any]:
        """
        Lấy số dư ví NCC từ cache tức thì (0ms) cho Dashboard mà không chặn luồng HTTP chính.
        Nếu cache quá hạn (180s), kích hoạt background thread để cập nhật tự động.
        """
        now = time.time()
        if self._cached_wallet and (now - self._wallet_cached_time < 180):
            return self._cached_wallet

        import threading
        if not getattr(self, "_wallet_refreshing", False):
            self._wallet_refreshing = True
            def _async_refresh():
                try:
                    self.get_wallet_balance(force_refresh=True)
                finally:
                    self._wallet_refreshing = False
            threading.Thread(target=_async_refresh, daemon=True).start()

        if self._cached_wallet:
            return self._cached_wallet

        fallback_budget = self.get_configured_budget_total()
        return {
            "balance": fallback_budget,
            "currency": "VND",
            "status": "active",
            "is_exhausted": False,
            "budget_total": fallback_budget,
            "budget_used": 0.0,
            "budget_remaining": fallback_budget,
        }

    def get_wallet_balance(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Lấy trạng thái số dư và thông tin quota trực tiếp từ endpoint /v1/usage của Upstream Provider.
        Được cache 180s để tránh làm nghẽn các tác vụ load Dashboard / Billing.
        """
        now = time.time()
        if not force_refresh and self._cached_wallet and (now - self._wallet_cached_time < 180):
            return self._cached_wallet

        if not self.raw_api_key or not self.base_url:
            res = {
                "balance": 0.0,
                "currency": "VND",
                "status": "unconfigured",
                "is_exhausted": True,
                "low_balance_warning": False,
                "key_name": "Chưa cấu hình",
                "key_masked": "Chưa cấu hình",
                "limit_type": "none",
                "percent_remaining": 0,
                "budget_total": 0.0,
                "budget_used": 0.0,
                "budget_remaining": 0.0,
                "used_percent": 0.0,
                "status_text": "Chưa cấu hình nhà cung cấp",
                "models_rates": [],
                "raw": {
                    "provider": getattr(settings, "UPSTREAM_PROVIDER_NAME", "Chưa cấu hình"),
                    "base_url": self.base_url,
                }
            }
            self._cached_wallet = res
            self._wallet_cached_time = now
            return res

        try:
            usage_url = self._build_url("/usage")
            headers = {"Authorization": f"Bearer {self.raw_api_key}"}
            resp = requests.get(usage_url, headers=headers, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                key_name = data.get("keyName", "")
                status = data.get("status", "active")
                limit_type = data.get("limitType", "unlimited")
                quota = data.get("quota", {})
                pct_remaining = quota.get("percentRemaining", 100) if isinstance(quota, dict) else 100
                is_active = (status == "active")
                is_unlimited = (limit_type == "unlimited")

                # Kiểm tra cạn kiệt Quota: chỉ cạn kiệt nếu status không active hoặc (không phải unlimited và % <= 0)
                if is_unlimited:
                    self.is_quota_exhausted = not is_active
                else:
                    self.is_quota_exhausted = not is_active or (pct_remaining is not None and pct_remaining <= 0)

                # Gói nạp ngân sách NCC: Tính theo cấu hình ngân sách linh hoạt
                base_quota_val = self.get_configured_budget_total()
                if base_quota_val > 0:
                    estimated_balance = base_quota_val * (pct_remaining / 100.0) if is_active else 0.0
                    spent_vnd = base_quota_val - estimated_balance
                    used_pct = round((spent_vnd / base_quota_val) * 100, 1)
                else:
                    # Khi chưa nạp log ngân sách thủ công (Unlimited mặc định của NCC)
                    estimated_balance = 0.0
                    spent_vnd = 0.0
                    used_pct = 0.0

                key_masked = data.get("keyMasked") or (self.raw_api_key[:10] + "..." + self.raw_api_key[-4:])

                model_rates = [
                    {"model": "gpt-image-2.5-flare", "display_name": "GPT Image 2.5 Flare", "cost_per_req": 75.0, "unit": "đ / request"},
                    {"model": "gpt-image-2.5-sunburst", "display_name": "GPT Image 2.5 Sunburst", "cost_per_req": 75.0, "unit": "đ / request"},
                    {"model": "gpt-image-2", "display_name": "GPT Image 2", "cost_per_req": 70.0, "unit": "đ / request"},
                    {"model": "gemini-3.1-flash-image-preview", "display_name": "Gemini 3.1 Flash Image", "cost_per_req": 50.0, "unit": "đ / request"},
                ]

                status_label = "Hoạt động (Không giới hạn)" if is_unlimited and is_active else ("Bình thường" if is_active else "Hết Quota")

                res = {
                    "balance": estimated_balance,
                    "currency": "VND",
                    "status": status,
                    "is_exhausted": self.is_quota_exhausted,
                    "low_balance_warning": not is_active or (not is_unlimited and pct_remaining < 5),
                    "key_name": key_name,
                    "key_masked": key_masked,
                    "limit_type": limit_type,
                    "percent_remaining": pct_remaining,
                    "budget_total": base_quota_val,
                    "budget_used": spent_vnd,
                    "budget_remaining": estimated_balance,
                    "used_percent": used_pct,
                    "status_text": status_label,
                    "models_rates": model_rates,
                    "raw": data
                }
                self._cached_wallet = res
                self._wallet_cached_time = now
                return res
        except Exception as e:
            print(f"[ProviderClient] Lỗi kiểm tra /v1/usage Xompet: {e}")

        fallback_budget = self.get_configured_budget_total()
        balance = 0.0 if self.is_quota_exhausted else fallback_budget
        fallback_rates = [
            {"model": "gpt-image-2.5-flare", "display_name": "GPT Image 2.5 Flare", "cost_per_req": 75.0, "unit": "đ / request"},
            {"model": "gpt-image-2.5-sunburst", "display_name": "GPT Image 2.5 Sunburst", "cost_per_req": 75.0, "unit": "đ / request"},
            {"model": "gpt-image-2", "display_name": "GPT Image 2", "cost_per_req": 70.0, "unit": "đ / request"},
            {"model": "gemini-3.1-flash-image-preview", "display_name": "Gemini 3.1 Flash Image", "cost_per_req": 50.0, "unit": "đ / request"},
        ]
        fallback_res = {
            "balance": balance,
            "currency": "VND",
            "status": "exhausted" if self.is_quota_exhausted else "active",
            "is_exhausted": self.is_quota_exhausted,
            "low_balance_warning": self.is_quota_exhausted,
            "budget_total": fallback_budget,
            "budget_used": 0.0,
            "budget_remaining": balance,
            "used_percent": 0.0,
            "key_masked": (self.raw_api_key[:10] + "..." + self.raw_api_key[-4:]) if self.raw_api_key else "Chưa cấu hình",
            "status_text": "Bình thường" if not self.is_quota_exhausted else "Hết Quota",
            "models_rates": fallback_rates,
            "raw": {
                "provider": getattr(settings, "UPSTREAM_PROVIDER_NAME", "Chưa cấu hình"),
                "base_url": self.base_url,
            }
        }
        self._cached_wallet = fallback_res
        self._wallet_cached_time = now
        return fallback_res

    @staticmethod
    def normalize_model(model_name: Optional[str] = None) -> str:
        """
        Chuẩn hóa tên model theo danh mục model được NCC Xompet hỗ trợ:
        - gpt-image-2.5-flare (Chất lượng cao nhất, HDR - Mặc định)
        - gpt-image-2.5-sunburst (Nghệ thuật, tương phản cao)
        - gpt-image-2 (Tiêu chuẩn 2.0)
        - nanobanana-2 (Siêu tốc độ)
        Tự động ánh xạ (aliasing) các model quốc tế (dall-e-3, dall-e-2, flux, midjourney) về model Xompet tối ưu.
        """
        m = (model_name or "gpt-image-2.5-flare").lower().strip()
        if "sunburst" in m:
            return "gpt-image-2.5-sunburst"
        elif "flare" in m or m in ("gpt-image-2.5", "gpt-image-2-5"):
            return "gpt-image-2.5-flare"
        elif "nanobanana" in m or "nanobana" in m:
            return "nanobanana-2"
        elif "dall-e-2" in m or "dalle-2" in m or "dalle2" in m:
            return "gpt-image-2"
        elif "dall-e" in m or "dalle" in m or "dall-e-3" in m or "dalle3" in m:
            return "gpt-image-2.5-flare"
        elif "gpt-image-2" in m or m == "gpt-image2":
            return "gpt-image-2"
        elif "gemini" in m:
            return "gemini-3.1-flash-image-preview"
        elif "flux" in m or "midjourney" in m or "chatgpt" in m:
            return "gpt-image-2.5-flare"
        return "gpt-image-2.5-flare"

    @staticmethod
    def normalize_resolution_and_aspect_ratio(aspect_ratio: str = "1024x1024", resolution: str = "1k") -> Tuple[str, str]:
        """
        Quy đổi tỷ lệ khung hình (aspectRatio) và độ phân giải (resolution)
        thành kích thước pixel thực tế (size: WIDTHxHEIGHT) chính xác.
        NCC yêu cầu số pixel cụ thể (tối đa 4K <= 4096px), không chấp nhận chuỗi '16:9' đơn thuần.
        """
        res = (resolution or "1k").lower().strip()
        ar = (aspect_ratio or "1024x1024").strip().lower()

        # Tự động nhận diện resolution nếu client gửi pixel trực tiếp
        if "4096" in ar or "3840" in ar:
            res = "4k"
        elif "2048" in ar or "2560" in ar or "3584" in ar:
            res = "2k"

        if res not in ("1k", "2k", "4k"):
            res = "1k"

        # Nếu client đã truyền đúng định dạng WIDTHxHEIGHT pixel hợp lệ
        if "x" in ar:
            parts = ar.split("x")
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                w, h = int(parts[0]), int(parts[1])
                if w <= 4096 and h <= 4096:
                    return f"{w}x{h}", res

        # Ánh xạ theo tỷ lệ khung hình và chuẩn điểm ảnh Native
        if res == "4k":
            ratio_map = {
                "1:1": "4096x4096",
                "1024x1024": "4096x4096",
                "16:9": "3840x2160",
                "9:16": "2160x3840",
                "4:3": "3840x2880",
                "3:4": "2880x3840",
                "3:2": "3840x2560",
                "2:3": "2560x3840"
            }
        elif res == "2k":
            ratio_map = {
                "1:1": "2048x2048",
                "1024x1024": "2048x2048",
                "16:9": "3584x2048",
                "9:16": "2048x3584",
                "4:3": "2816x2112",
                "3:4": "2112x2816",
                "3:2": "3072x2048",
                "2:3": "2048x3072"
            }
        else: # 1k (Chuẩn mặc định)
            ratio_map = {
                "1:1": "1024x1024",
                "1024x1024": "1024x1024",
                "16:9": "1792x1024",
                "9:16": "1024x1792",
                "4:3": "1408x1056",
                "3:4": "1056x1408",
                "3:2": "1536x1024",
                "2:3": "1024x1536"
            }

        mapped_size = ratio_map.get(ar, "1024x1024" if res == "1k" else ("2048x2048" if res == "2k" else "4096x4096"))
        return mapped_size, res

    @staticmethod
    def normalize_quality(quality: Optional[str] = "medium") -> str:
        """
        Chuẩn hóa thông số quality:
        - low (draft): Bản nháp nhanh, ít bước render
        - medium (standard): Tiêu chuẩn cân bằng (mặc định)
        - high (hd, ultra): Siêu chi tiết sắc nét cao
        """
        q = (quality or "medium").lower().strip()
        if q in ("high", "hd", "ultra"):
            return "high"
        elif q in ("low", "fast", "draft"):
            return "low"
        return "medium"

    @staticmethod
    def _optimize_prompt_for_diffusion(prompt: str) -> str:
        """
        Tự động dịch prompt tiếng Việt sang tiếng Anh nếu phát hiện ký tự có dấu.
        Giúp GPU xử lý trực tiếp không qua bước LLM dịch của NCC,
        rút ngắn thời gian từ 130s xuống 30s-40s và tăng độ chính xác của hình ảnh.
        """
        if not prompt:
            return ""
        if all(ord(c) < 128 for c in prompt):
            return prompt
        try:
            import urllib.parse
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + urllib.parse.quote(prompt)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                translated = "".join([part[0] for part in data[0] if part and part[0]])
                if translated and len(translated.strip()) > 2:
                    return translated.strip()
        except Exception as e:
            print(f"[ProviderClient] Auto-translate error: {e}")
        return prompt

    def _resolve_image_to_bytes(self, img_ref: str) -> Optional[Tuple[str, bytes, str]]:
        """
        Phân giải đường dẫn ảnh tham chiếu (URL, Base64 Data URI, hoặc file cục bộ)
        thành bộ (filename, bytes_data, mime_type) chuẩn cho multipart upload.
        """
        if not img_ref:
            return None
        ref_str = str(img_ref).strip()

        # 1. Base64 Data URI
        if ref_str.startswith("data:image/"):
            try:
                header, b64_part = ref_str.split(",", 1)
                mime = header.split(";")[0].replace("data:", "")
                ext = ".png" if "png" in mime else (".webp" if "webp" in mime else ".jpg")
                raw_bytes = base64.b64decode(b64_part)
                return f"ref_input{ext}", raw_bytes, mime
            except Exception as e:
                print(f"[ProviderClient] Lỗi decode Base64 reference: {e}")
                return None

        # 2. File cục bộ trên máy
        ref_dir = settings.REFERENCES_UPLOAD_DIR
        gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        local_path = None

        if os.path.exists(ref_str) and os.path.isfile(ref_str):
            local_path = ref_str
        elif "/static/uploads/references/" in ref_str:
            fname = ref_str.split("/static/uploads/references/")[-1].split("?")[0]
            p = os.path.join(ref_dir, fname)
            if os.path.exists(p):
                local_path = p
        elif "/static/uploads/generated/" in ref_str:
            fname = ref_str.split("/static/uploads/generated/")[-1].split("?")[0]
            p = os.path.join(gen_dir, fname)
            if os.path.exists(p):
                local_path = p
        elif "/static/uploads/" in ref_str:
            fname = ref_str.split("/static/uploads/")[-1].split("?")[0]
            p = os.path.join(settings.UPLOAD_DIR, fname)
            if os.path.exists(p):
                local_path = p
        elif getattr(settings, "PUBLIC_API_URL", "") and getattr(settings, "PUBLIC_API_URL", "") in ref_str:
            fname = ref_str.split("/")[-1].split("?")[0]
            p_ref = os.path.join(ref_dir, fname)
            p_gen = os.path.join(gen_dir, fname)
            if os.path.exists(p_ref):
                local_path = p_ref
            elif os.path.exists(p_gen):
                local_path = p_gen

        if local_path and os.path.exists(local_path):
            try:
                ext = os.path.splitext(local_path)[1].lower() or ".png"
                mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
                with open(local_path, "rb") as f:
                    return os.path.basename(local_path), f.read(), mime
            except Exception as e:
                print(f"[ProviderClient] Lỗi đọc file local reference: {e}")

        # 3. URL từ xa (tải về và cache tạm)
        if ref_str.startswith("http://") or ref_str.startswith("https://"):
            try:
                url_hash = hashlib.md5(ref_str.encode("utf-8")).hexdigest()[:16]
                cached_name = f"cached_{url_hash}.png"
                cached_path = os.path.join(ref_dir, cached_name)
                
                if os.path.exists(cached_path) and os.path.getsize(cached_path) > 0:
                    with open(cached_path, "rb") as f:
                        return cached_name, f.read(), "image/png"
                
                dl = requests.get(ref_str, headers={"User-Agent": self.user_agent}, timeout=20)
                if dl.status_code == 200 and dl.content:
                    os.makedirs(ref_dir, exist_ok=True)
                    f_mime = "image/png"
                    f_ext = ".png"
                    try:
                        im = Image.open(io.BytesIO(dl.content))
                        fmt = (im.format or "").upper()
                        if fmt in ("JPEG", "JPG"):
                            f_mime = "image/jpeg"
                            f_ext = ".jpg"
                        elif fmt == "WEBP":
                            f_mime = "image/webp"
                            f_ext = ".webp"
                        elif fmt == "PNG":
                            f_mime = "image/png"
                            f_ext = ".png"
                    except Exception:
                        c_type = dl.headers.get("Content-Type", "").lower()
                        if "jpeg" in c_type or "jpg" in c_type or "jpeg" in ref_str.lower() or "jpg" in ref_str.lower():
                            f_mime = "image/jpeg"
                            f_ext = ".jpg"

                    cached_name = f"cached_{url_hash}{f_ext}"
                    cached_path = os.path.join(ref_dir, cached_name)
                    with open(cached_path, "wb") as f_out:
                        f_out.write(dl.content)
                    return cached_name, dl.content, f_mime
            except Exception as e:
                print(f"[ProviderClient] Lỗi tải ảnh tham chiếu từ xa ({ref_str}): {e}")

        return None

    def generate_image_upstream(
        self,
        prompt: str,
        model: str = "gpt-image-2.5-flare",
        aspect_ratio: str = "1024x1024",
        resolution: str = "1k",
        quality: str = "medium",
        reference: Optional[str] = None,
        references: Optional[List[str]] = None,
        count: int = 1,
        execution_mode: str = "sync",
        provider_key: Optional[str] = None,
        provider_url: Optional[str] = None,
        supported_models: Optional[List[str]] = None
    ) -> Tuple[int, Dict[str, Any], int]:
        """
        Gửi yêu cầu tạo ảnh tới Nhà Cung Cấp (hỗ trợ chỉ định URL và Key động để Failover).
        - Nếu không có ảnh tham chiếu -> Gọi POST /v1/images/generations (Text-to-Image).
        - Nếu có ảnh tham chiếu -> Gọi POST /v1/images/edits (Image-to-Image / Sửa ảnh).
        Trả về: (status_code, response_dict, latency_ms)
        """
        start_time = time.time()
        active_key = (provider_key or "").strip() or self.raw_api_key
        active_url = (provider_url or "").strip() or self.base_url
        if not active_key or not active_url:
            return (400, {
                "error": {
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "message": "Hệ thống chưa cấu hình Nhà Cung Cấp AI (Upstream Provider). Vui lòng thêm và kích hoạt NCC tại trang Quản trị NCC."
                }
            }, 0)

        # 1. Chuẩn hóa model, pixel size và quality
        mapped_model = self.normalize_model(model)
        if supported_models and isinstance(supported_models, list) and len(supported_models) > 0:
            if mapped_model not in supported_models:
                if "gpt-image-2" in supported_models:
                    mapped_model = "gpt-image-2"
                elif "gpt-image-2.5-flare" in supported_models:
                    mapped_model = "gpt-image-2.5-flare"
                else:
                    mapped_model = supported_models[0]
                print(f"[ProviderClient] Điều chỉnh model phù hợp danh mục NCC hỗ trợ ({supported_models}): {mapped_model}")

        mapped_size, mapped_res = self.normalize_resolution_and_aspect_ratio(aspect_ratio, resolution)
        mapped_qual = self.normalize_quality(quality)

        # 2. Làm sạch prompt và tối ưu tiếng Việt
        clean_prompt = " ".join(prompt.split()) if prompt else ""
        prompt_for_ai = self._optimize_prompt_for_diffusion(clean_prompt)
        
        # Cắt tỉa an toàn nếu prompt vượt quá 1800 ký tự để tránh upstream gateway từ chối 422
        if len(prompt_for_ai) > 1800:
            prompt_for_ai = prompt_for_ai[:1800]

        # Tương thích đặc thù NCC: Leeh Gateway chỉ chấp nhận 1024x1024 (1:1) và prompt <= 1500 chars
        if "leeh" in (active_url or "").lower():
            aspect_ratio = "1:1"
            mapped_size = "1024x1024"
            if len(prompt_for_ai) > 1500:
                prompt_for_ai = prompt_for_ai[:1500]

        # 3. Thu thập danh sách ảnh tham chiếu
        ref_list: List[str] = []
        if references and isinstance(references, list):
            ref_list.extend([str(r).strip() for r in references if r and str(r).strip()])
        if reference and isinstance(reference, str) and reference.strip() and reference.strip() not in ref_list:
            ref_list.append(reference.strip())

        headers = {
            "Authorization": f"Bearer {active_key}",
            "User-Agent": self.user_agent
        }

        status_code = 500
        resp_data: Dict[str, Any] = {}
        payload: Optional[Dict[str, Any]] = None

        try:
            # ==============================================================
            # TRUONG HOP A: IMAGE-TO-IMAGE / SUA ANH MULTI-REFERENCE (/v1/images/edits)
            # Gui toan bo danh sach anh tham chieu neu NCC khong phai leeh.dev
            # ==============================================================
            if ref_list and "leeh" not in (active_url or "").lower():
                resolved_images = []
                for r_item in ref_list[:5]:
                    resolved = self._resolve_image_to_bytes(r_item)
                    if resolved:
                        fname, fbytes, fmime = resolved
                        try:
                            im_chk = Image.open(io.BytesIO(fbytes))
                            if im_chk.size[0] < 64 or im_chk.size[1] < 64:
                                im_chk = im_chk.resize((512, 512), Image.Resampling.LANCZOS)
                                buf = io.BytesIO()
                                im_chk.save(buf, format="PNG")
                                fbytes = buf.getvalue()
                                fname = "resized_sample.png"
                                fmime = "image/png"
                        except Exception:
                            pass
                        resolved_images.append((fname, fbytes, fmime))

                if resolved_images:
                    files = []
                    for fname, fbytes, fmime in resolved_images:
                        files.append(("image", (fname, fbytes, fmime)))

                    form_data = {
                        "model": mapped_model,
                        "prompt": prompt_for_ai,
                        "size": mapped_size,
                        "quality": mapped_qual,
                        "response_format": "url",
                        "n": count
                    }
                    edit_url = self._build_url("/images/edits", base_url=active_url)
                    print(f"[ProviderClient] Calling Edits API with {len(resolved_images)} reference(s): {edit_url} (model={mapped_model}, size={mapped_size}, quality={mapped_qual})")
                    
                    res = requests.post(edit_url, headers=headers, files=files, data=form_data, timeout=self.timeout)
                    status_code = res.status_code
                    try:
                        resp_data = res.json()
                        # Một số gateway trả về HTTP 200 nhưng có trường error
                        if isinstance(resp_data, dict) and "error" in resp_data:
                            status_code = 400
                        elif isinstance(resp_data, dict) and "data" in resp_data and isinstance(resp_data["data"], list):
                            for d_item in resp_data["data"]:
                                if isinstance(d_item, dict) and "b64_json" in d_item and not d_item.get("url"):
                                    raw_b64 = d_item["b64_json"]
                                    if raw_b64 and not raw_b64.startswith("data:image/"):
                                        d_item["b64_json"] = f"data:image/png;base64,{raw_b64}"
                    except Exception:
                        resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

            # ==============================================================
            # TRUONG HOP B: TEXT-TO-IMAGE hoac IMAGE-TO-IMAGE QUA JSON (/v1/images/generations)
            # CHỈ gọi nếu không có ảnh tham chiếu (Text-to-Image) HOẶC là provider hỗ trợ sourceImages (như Leeh)
            # Tuyệt đối không fallback sang text /images/generations khi khách yêu cầu sửa ảnh để tránh AI trả lời text đòi ảnh
            # ==============================================================
            if (not ref_list or "leeh" in (active_url or "").lower()) and status_code != 200 and status_code != 504:
                gen_url = self._build_url("/images/generations", base_url=active_url)
                is_leeh = "leeh" in (active_url or "").lower()
                
                # Dong goi sourceImages dang Base64 Data URI cho Leeh hoac fallback JSON
                source_images_list = []
                gen_mode = "generation"
                if ref_list:
                    gen_mode = "edit"
                    for r_item in ref_list[:5]:
                        r_str = str(r_item).strip()
                        if r_str.startswith("data:image/"):
                            source_images_list.append(r_str)
                        else:
                            resolved_ref = self._resolve_image_to_bytes(r_str)
                            if resolved_ref:
                                _, rf_bytes, rf_mime = resolved_ref
                                b64_str = base64.b64encode(rf_bytes).decode("utf-8")
                                source_images_list.append(f"data:{rf_mime};base64,{b64_str}")
                            else:
                                source_images_list.append(r_str)

                payload = {
                    "model": "gpt-image-2" if is_leeh else mapped_model,
                    "modelKey": "gpt-image-2" if is_leeh else mapped_model,
                    "prompt": prompt_for_ai,
                    "size": "1024x1024" if is_leeh else mapped_size,
                    "aspectRatio": "1:1" if is_leeh else (aspect_ratio or "1024x1024"),
                    "resolution": resolution or "1k",
                    "quality": mapped_qual,
                    "mode": gen_mode,
                    "response_format": "url",
                    "n": count,
                    "count": count
                }
                if source_images_list:
                    payload["sourceImages"] = source_images_list
                    payload["executionMode"] = "sync"
                headers["Content-Type"] = "application/json"
                print(f"[ProviderClient] Calling Generation API: {gen_url} (model={mapped_model}, size={mapped_size}, quality={mapped_qual})")

                res = requests.post(gen_url, headers=headers, json=payload, timeout=self.timeout)
                status_code = res.status_code
                try:
                    resp_data = res.json()
                except Exception:
                    resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

            # Nếu gặp lỗi 422 (Do tỷ lệ khung hình hoặc prompt quá dài bị NCC từ chối), tự động fallback về tỷ lệ chuẩn 1:1 và prompt rút gọn
            if status_code == 422 and payload is not None:
                print(f"[ProviderClient] Upstream {active_url} từ chối 422. Tự động thử lại với tỷ lệ chuẩn 1:1 và prompt rút gọn...")
                payload["aspectRatio"] = "1:1"
                payload["size"] = "1024x1024"
                if len(payload.get("prompt", "")) > 1000:
                    payload["prompt"] = payload["prompt"][:1000]
                gen_url = self._build_url("/images/generations", base_url=active_url)
                res = requests.post(gen_url, headers={**headers, "Content-Type": "application/json"}, json=payload, timeout=self.timeout)
                status_code = res.status_code
                try:
                    resp_data = res.json()
                except Exception:
                    resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

            # Kiểm tra nếu response trả về text (LLM chat/từ chối bằng tiếng Trung/Anh) thay vì ảnh thực
            if status_code in (200, 201) and isinstance(resp_data, dict) and "data" in resp_data:
                data_list = resp_data.get("data")
                if isinstance(data_list, list) and len(data_list) > 0 and isinstance(data_list[0], dict):
                    first_item = data_list[0]
                    b64_val = str(first_item.get("b64_json") or "").strip()
                    url_val = str(first_item.get("url") or "").strip()
                    if b64_val and len(b64_val) < 800 and not b64_val.startswith("data:image/"):
                        if any(w in b64_val for w in ["请", "图片", "抱歉", "sorry", "image", "upload", "provide", "required"]):
                            status_code = 422
                            resp_data = {
                                "error": {
                                    "code": "IMAGE_INPUT_REQUIRED",
                                    "message": f"Mô hình AI từ chối và yêu cầu cung cấp hình ảnh tham chiếu: {b64_val}",
                                    "type": "invalid_request_error"
                                }
                            }

        except requests.exceptions.Timeout:
            status_code = 504
            resp_data = {"error": {"message": f"Upstream AI Engine {active_url} timeout."}}
        except Exception as e:
            status_code = 500
            resp_data = {"error": {"message": f"Provider request error ({active_url}): {str(e)}"}}

        latency_ms = int((time.time() - start_time) * 1000)
        return status_code, resp_data, latency_ms

    def generate_image_with_failover(
        self,
        db: Any,
        prompt: str,
        model: str = "gpt-image-2.5-flare",
        aspect_ratio: str = "1024x1024",
        resolution: str = "1k",
        quality: str = "medium",
        reference: Optional[str] = None,
        references: Optional[List[str]] = None,
        count: int = 1,
        execution_mode: str = "sync",
        user_provider_key: Optional[str] = None
    ) -> Tuple[int, Dict[str, Any], int, Optional[str], float]:
        """
        Gửi yêu cầu tạo ảnh với cơ chế Auto-Failover:
        - Thứ tự ưu tiên: NCC is_primary = True trước, tiếp đó là các NCC is_active = True
        - Nếu NCC chính gặp sự cố (status >= 400 hoặc có error trong response), tự động đảo sang NCC dự phòng kế tiếp
        - Trả về: (status_code, resp_data, latency_ms, successful_provider_name, cost_per_image)
        """
        providers_list = []
        if db:
            try:
                from app.modules.providers.models import AIProvider
                from sqlalchemy import desc
                providers_list = (
                    db.query(AIProvider)
                    .filter(AIProvider.is_active == True)
                    .order_by(desc(AIProvider.is_primary), AIProvider.id)
                    .all()
                )
            except Exception as e:
                print(f"[ProviderClient] Lỗi truy vấn danh sách AIProvider: {e}")

        # Fallback nếu không truy vấn được DB
        if not providers_list:
            status_code, resp_data, latency_ms = self.generate_image_upstream(
                prompt=prompt,
                model=model,
                aspect_ratio=aspect_ratio,
                resolution=resolution,
                quality=quality,
                reference=reference,
                references=references,
                count=count,
                execution_mode=execution_mode,
                provider_key=user_provider_key,
                provider_url=self.base_url
            )
            return status_code, resp_data, latency_ms, getattr(settings, "UPSTREAM_PROVIDER_NAME", "Default Provider"), 75.0

        last_status = 500
        last_resp: Dict[str, Any] = {"error": {"message": "Không có nhà cung cấp nào phản hồi thành công"}}
        total_latency = 0

        for idx, prov in enumerate(providers_list):
            p_name = prov.name or f"Provider-{idx+1}"
            p_url = prov.base_url
            p_key = user_provider_key or prov.api_key

            supported_list = []
            if prov.models_supported:
                try:
                    supported_list = json.loads(prov.models_supported) if isinstance(prov.models_supported, str) else prov.models_supported
                except Exception:
                    pass

            print(f"[ProviderClient] [Lượt {idx+1}/{len(providers_list)}] Gửi yêu cầu tới NCC: {p_name} ({p_url})")

            max_attempts = 4
            status_code = 500
            resp_data = {}
            is_success = False

            for attempt in range(1, max_attempts + 1):
                if attempt > 1:
                    retry_delay = 2.0 * (attempt - 1)
                    print(f"[ProviderClient] 🔄 [Auto-Retry {attempt}/{max_attempts}] Đang thử lại tới NCC {p_name} sau {retry_delay}s...")
                    time.sleep(retry_delay)

                status_code, resp_data, latency_ms = self.generate_image_upstream(
                    prompt=prompt,
                    model=model,
                    aspect_ratio=aspect_ratio,
                    resolution=resolution,
                    quality=quality,
                    reference=reference,
                    references=references,
                    count=count,
                    execution_mode=execution_mode,
                    provider_key=p_key,
                    provider_url=p_url,
                    supported_models=supported_list
                )
                total_latency += latency_ms

                is_success = (status_code in (200, 201)) and ("error" not in resp_data)
                if is_success:
                    if attempt > 1:
                        print(f"[ProviderClient] 🎯 Auto-retry thành công ở lần thử thứ {attempt}!")
                    break

                err_text = str(resp_data).lower()
                is_retryable = (
                    status_code >= 500
                    or status_code == 429
                    or "gateway_request_failed" in err_text
                    or "rejected the request" in err_text
                    or "rejected this request" in err_text
                    or "quota coordinator" in err_text
                    or "capacity is currently busy" in err_text
                    or "currently busy" in err_text
                    or "overloaded" in err_text
                    or "rate limit" in err_text
                    or "timeout" in err_text
                    or "connection" in err_text
                    or "cloudflare" in err_text
                    or "524" in err_text
                    or "<!doctype" in err_text
                    or "<html" in err_text
                )
                if not is_retryable:
                    print(f"[ProviderClient] Gặp lỗi vĩnh viễn (HTTP {status_code}), dừng thử lại NCC {p_name}.")
                    break

            if is_success:
                if idx > 0:
                    print(f"[ProviderClient] 🎯 [FAILOVER THÀNH CÔNG] Đã tự động đảo sang NCC: {p_name} thành công ({latency_ms}ms)!")
                else:
                    print(f"[ProviderClient] ✅ NCC chính {p_name} phản hồi thành công ({latency_ms}ms)!")

                try:
                    prov.latency_ms = latency_ms
                    prov.status = "ONLINE"
                    db.commit()
                except Exception:
                    pass

                prov_cost = float(prov.cost_per_image) if (prov and getattr(prov, "cost_per_image", None) is not None) else 75.0
                return status_code, resp_data, total_latency, p_name, prov_cost

            # Thất bại tại NCC này
            last_status = status_code
            last_resp = resp_data
            err_msg = ""
            if isinstance(resp_data, dict):
                err_msg = resp_data.get("error", {}).get("message") or resp_data.get("message") or str(resp_data)
            else:
                err_msg = str(resp_data)

            print(f"[ProviderClient] ⚠️ NCC {p_name} lỗi [HTTP {status_code}]: {err_msg[:200]}")

            # Không tự ý ghi đè trạng thái NCC thành ERROR khi chỉ có lỗi của một job đơn lẻ
            pass

            if idx < len(providers_list) - 1:
                next_p = providers_list[idx + 1]
                print(f"[ProviderClient] 🔄 TỰ ĐỘNG ĐẢO SANG NCC KẾ TIẾP: {next_p.name} ({next_p.base_url})...")

        print(f"[ProviderClient] ❌ Tất cả {len(providers_list)} NCC đều không phản hồi thành công.")
        return last_status, last_resp, total_latency, None, 0.0

provider_client = ProviderClient()
