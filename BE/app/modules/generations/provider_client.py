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
        self.timeout = 180
        self.is_quota_exhausted = True  # Key hiện tại trên Xompet đã hết quota (429 request_limit_exhausted)
        self.custom_budget_total: Optional[float] = None

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
        return getattr(settings, "UPSTREAM_PROVIDER_URL", "").rstrip("/")

    @property
    def raw_api_key(self) -> str:
        return getattr(settings, "UPSTREAM_PROVIDER_KEY", "")

    @property
    def default_model(self) -> str:
        return getattr(settings, "UPSTREAM_DEFAULT_IMAGE_MODEL", "gpt-image-2.5-flare")

    def _build_url(self, endpoint: str) -> str:
        base = self.base_url
        if not base:
            return endpoint
        ep = endpoint.strip()
        if not ep.startswith("/"):
            ep = "/" + ep
        if base.endswith("/v1") and ep.startswith("/v1/"):
            ep = ep[3:]
        return f"{base}{ep}"

    def get_wallet_balance(self) -> Dict[str, Any]:
        """
        Lấy trạng thái số dư và thông tin quota trực tiếp từ endpoint /v1/usage của Upstream Provider.
        """
        if not self.raw_api_key or not self.base_url:
            return {
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

        try:
            usage_url = self._build_url("/usage")
            headers = {"Authorization": f"Bearer {self.raw_api_key}"}
            resp = requests.get(usage_url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                key_name = data.get("keyName", "")
                status = data.get("status", "active")
                limit_type = data.get("limitType", "unlimited")
                quota = data.get("quota", {})
                pct_remaining = quota.get("percentRemaining", 100) if isinstance(quota, dict) else 100
                is_active = (status == "active")
                self.is_quota_exhausted = not is_active

                # Gói nạp ngân sách NCC: Tính theo cấu hình ngân sách linh hoạt
                base_quota_val = self.get_configured_budget_total()
                estimated_balance = base_quota_val * (pct_remaining / 100.0) if is_active else 0.0
                spent_vnd = base_quota_val - estimated_balance
                used_pct = round((spent_vnd / base_quota_val) * 100, 1)
                key_masked = data.get("keyMasked") or (self.raw_api_key[:10] + "..." + self.raw_api_key[-4:])

                model_rates = [
                    {"model": "gpt-image-2.5-flare", "display_name": "GPT Image 2.5 Flare", "cost_per_req": 75.0, "unit": "đ / request"},
                    {"model": "gpt-image-2.5-sunburst", "display_name": "GPT Image 2.5 Sunburst", "cost_per_req": 75.0, "unit": "đ / request"},
                    {"model": "gpt-image-2", "display_name": "GPT Image 2", "cost_per_req": 70.0, "unit": "đ / request"},
                    {"model": "gemini-3.1-flash-image-preview", "display_name": "Gemini 3.1 Flash Image", "cost_per_req": 50.0, "unit": "đ / request"},
                ]

                return {
                    "balance": estimated_balance,
                    "currency": "VND",
                    "status": status,
                    "is_exhausted": not is_active,
                    "low_balance_warning": not is_active or pct_remaining < 5,
                    "key_name": key_name,
                    "key_masked": key_masked,
                    "limit_type": limit_type,
                    "percent_remaining": pct_remaining,
                    "budget_total": base_quota_val,
                    "budget_used": spent_vnd,
                    "budget_remaining": estimated_balance,
                    "used_percent": used_pct,
                    "status_text": "Bình thường" if is_active else "Hết Quota",
                    "models_rates": model_rates,
                    "raw": data
                }
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
        return {
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
        upload_dir = settings.REFERENCES_UPLOAD_DIR
        local_path = None
        if os.path.exists(ref_str) and os.path.isfile(ref_str):
            local_path = ref_str
        elif "/static/uploads/references/" in ref_str:
            fname = ref_str.split("/static/uploads/references/")[-1]
            p = os.path.join(upload_dir, fname)
            if os.path.exists(p):
                local_path = p
        elif getattr(settings, "PUBLIC_API_URL", "") in ref_str:
            fname = ref_str.split("/")[-1]
            p = os.path.join(upload_dir, fname)
            if os.path.exists(p):
                local_path = p

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
                ext = ".jpg" if (".jpg" in ref_str.lower() or ".jpeg" in ref_str.lower()) else ".png"
                cached_name = f"cached_{url_hash}{ext}"
                cached_path = os.path.join(upload_dir, cached_name)
                
                if os.path.exists(cached_path) and os.path.getsize(cached_path) > 0:
                    mime = "image/jpeg" if ext == ".jpg" else "image/png"
                    with open(cached_path, "rb") as f:
                        return cached_name, f.read(), mime
                
                dl = requests.get(ref_str, headers={"User-Agent": self.user_agent}, timeout=15)
                if dl.status_code == 200:
                    os.makedirs(upload_dir, exist_ok=True)
                    with open(cached_path, "wb") as f_out:
                        f_out.write(dl.content)
                    mime = dl.headers.get("Content-Type", "image/png")
                    return cached_name, dl.content, mime
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
        provider_key: Optional[str] = None
    ) -> Tuple[int, Dict[str, Any], int]:
        """
        Gửi yêu cầu tạo ảnh tới Nhà Cung Cấp mới (Xompet / Cunai OpenAI-compatible Gateway).
        - Nếu không có ảnh tham chiếu -> Gọi POST /v1/images/generations (Text-to-Image).
        - Nếu có ảnh tham chiếu -> Gọi POST /v1/images/edits (Image-to-Image / Sửa ảnh).
        Trả về: (status_code, response_dict, latency_ms)
        """
        start_time = time.time()
        active_key = (provider_key or "").strip() or self.raw_api_key
        if not active_key or not self.base_url:
            return (400, {
                "error": {
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "message": "Hệ thống chưa cấu hình Nhà Cung Cấp AI (Upstream Provider). Vui lòng thêm và kích hoạt NCC tại trang Quản trị NCC."
                }
            }, 0)

        # 1. Chuẩn hóa model, pixel size và quality
        mapped_model = self.normalize_model(model)
        mapped_size, mapped_res = self.normalize_resolution_and_aspect_ratio(aspect_ratio, resolution)
        mapped_qual = self.normalize_quality(quality)

        # 2. Tối ưu prompt tiếng Việt
        prompt_for_ai = self._optimize_prompt_for_diffusion(prompt)

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

        try:
            # ==============================================================
            # TRƯỜNG HỢP A: IMAGE-TO-IMAGE / SỬA ẢNH (/v1/images/edits)
            # ==============================================================
            if ref_list:
                primary_ref = ref_list[0]
                resolved = self._resolve_image_to_bytes(primary_ref)
                
                if resolved:
                    fname, fbytes, fmime = resolved
                    
                    # Đảm bảo ảnh không bị quá nhỏ (< 64px) khiến GPU từ chối
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

                    files = {"image": (fname, fbytes, fmime)}
                    form_data = {
                        "model": mapped_model,
                        "prompt": prompt_for_ai,
                        "size": mapped_size,
                        "quality": mapped_qual,
                        "response_format": "url",
                        "n": count
                    }
                    edit_url = self._build_url("/images/edits")
                    print(f"[ProviderClient] Calling Edits API: {edit_url} (model={mapped_model}, size={mapped_size}, quality={mapped_qual})")
                    
                    res = requests.post(edit_url, headers=headers, files=files, data=form_data, timeout=self.timeout)
                    status_code = res.status_code
                    try:
                        resp_data = res.json()
                    except Exception:
                        resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

            # ==============================================================
            # TRƯỜNG HỢP B: TEXT-TO-IMAGE (/v1/images/generations)
            # ==============================================================
            if not ref_list or (status_code != 200 and "image_url fetch failed" in str(resp_data)):
                gen_url = self._build_url("/images/generations")
                payload = {
                    "model": mapped_model,
                    "prompt": prompt_for_ai,
                    "size": mapped_size,
                    "quality": mapped_qual,
                    "response_format": "url",
                    "n": count
                }
                headers["Content-Type"] = "application/json"
                print(f"[ProviderClient] Calling Generation API: {gen_url} (model={mapped_model}, size={mapped_size}, quality={mapped_qual})")

                res = requests.post(gen_url, headers=headers, json=payload, timeout=self.timeout)
                status_code = res.status_code
                try:
                    resp_data = res.json()
                except Exception:
                    resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

            # Smart Retry 1 lần nếu gặp lỗi tạm thời (500/502/503/504)
            if status_code in (500, 502, 503, 504):
                print(f"[ProviderClient] Upstream trả về HTTP {status_code}. Thử lại lần 2 sau 2s...")
                time.sleep(2)
                gen_url = self._build_url("/images/generations")
                res = requests.post(gen_url, headers={**headers, "Content-Type": "application/json"}, json={
                    "model": mapped_model,
                    "prompt": prompt_for_ai,
                    "size": mapped_size,
                    "quality": mapped_qual,
                    "response_format": "url",
                    "n": count
                }, timeout=self.timeout)
                status_code = res.status_code
                try:
                    resp_data = res.json()
                except Exception:
                    resp_data = {"error": {"message": res.text[:300] or f"HTTP {status_code}"}}

        except requests.exceptions.Timeout:
            status_code = 504
            resp_data = {"error": {"message": "Upstream AI Engine timeout (quá 180s). Vui lòng thử lại với prompt ngắn hơn hoặc kích thước 1K/2K."}}
        except Exception as e:
            status_code = 500
            resp_data = {"error": {"message": f"Provider request error: {str(e)}"}}

        latency_ms = int((time.time() - start_time) * 1000)
        return status_code, resp_data, latency_ms

provider_client = ProviderClient()
