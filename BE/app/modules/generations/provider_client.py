import time
import json
import ssl
import os
import base64
import hashlib
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple, List
from app.core.config import settings

class ProviderClient:
    BASE_URL = os.getenv("UPSTREAM_PROVIDER_URL", "https://api.leeh.dev")
    DEFAULT_USER = os.getenv("UPSTREAM_PROVIDER_USER", "willownelson")
    DEFAULT_PASS = os.getenv("UPSTREAM_PROVIDER_PASS", "123123123")
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    def __init__(self):
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        self.access_token: Optional[str] = None
        self.raw_api_key: Optional[str] = os.getenv("UPSTREAM_PROVIDER_KEY", "sk-5BZ6LD4DPV5BW75GFNVL4BBOMOHKXDOK37LLQROO7NNVXXSXQ55A====")
        self.token_expiry: float = 0.0


    def _make_request(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 240
    ) -> Tuple[int, Dict[str, Any]]:
        url = f"{self.BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
        req_headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
        }
        if headers:
            req_headers.update(headers)

        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=data, headers=req_headers, method=method)

        try:
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=timeout) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8", errors="ignore")
                return status_code, json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(error_body)
            except Exception:
                err_json = {"error": {"message": error_body or f"HTTP {e.code}"}}
            return e.code, err_json
        except Exception as e:
            return 500, {"error": {"message": str(e)}}

    def login(self, username: str = DEFAULT_USER, password: str = DEFAULT_PASS) -> Dict[str, Any]:
        """
        Đăng nhập tài khoản nhà cung cấp để lấy access_token
        """
        status, resp = self._make_request(
            "/api/v1/auth/login",
            method="POST",
            payload={"username": username, "password": password}
        )
        if status == 200 and "access_token" in resp:
            self.access_token = resp["access_token"]
            self.token_expiry = time.time() + 3500
            return resp
        raise RuntimeError(f"Đăng nhập NCC thất bại [{status}]: {resp.get('error', resp)}")

    def ensure_auth(self) -> str:
        """
        Đảm bảo access_token luôn còn hạn
        """
        if not self.access_token or time.time() > self.token_expiry:
            self.login()
        return self.access_token

    def get_wallet_balance(self) -> Dict[str, Any]:
        """
        Lấy số dư ví thực tế từ tài khoản Nhà Cung Cấp
        """
        token = self.ensure_auth()
        status, resp = self._make_request(
            "/api/v1/wallet",
            method="GET",
            headers={"Authorization": f"Bearer {token}"}
        )
        if status == 200:
            return {
                "balance": float(resp.get("balance", 24702.0)),
                "currency": resp.get("currency", "VND"),
                "status": resp.get("status", "active"),
                "raw": resp
            }
        return {"balance": 24702.0, "currency": "VND", "status": "simulated", "raw": resp}

    @staticmethod
    def normalize_resolution_and_aspect_ratio(aspect_ratio: str = "1024x1024", resolution: str = "1k") -> Tuple[str, str]:
        """
        Chuẩn hóa và kết hợp độ phân giải (1k, 2k, 4k) với aspectRatio (1024x1024, 2048x2048, 4096x4096, 16:9, 9:16)
        """
        res = (resolution or "1k").lower().strip()
        ar = (aspect_ratio or "1024x1024").strip()

        # Nhận diện resolution từ aspectRatio nếu client gửi trực tiếp kích thước pixel
        if "4096" in ar or "3840" in ar:
            res = "4k"
        elif "2048" in ar or "2560" in ar:
            res = "2k"
        elif "1024" in ar and not resolution:
            res = "1k"

        if res not in ("1k", "2k", "4k"):
            res = "1k"

        # Tự động ánh xạ kích thước chi tiết dựa trên resolution và tỷ lệ hợp lệ của NCC
        if res == "2k":
            if ar in ("1024x1024", "1:1", "2048x2048"):
                ar = "2048x2048"
            elif ar in ("16:9", "1280x720", "1920x1080", "2560x1440"):
                ar = "16:9"
            elif ar in ("9:16", "720x1280", "1080x1920", "1440x2560"):
                ar = "9:16"
            elif ar in ("4:3", "3:4", "3:2", "2:3"):
                ar = ar
            else:
                ar = "2048x2048"
        elif res == "4k":
            if ar in ("1024x1024", "2048x2048", "4096x4096", "1:1"):
                ar = "2048x2048"
            elif ar in ("16:9", "1280x720", "1920x1080", "2560x1440", "3840x2160"):
                ar = "16:9"
            elif ar in ("9:16", "720x1280", "1080x1920", "1440x2560", "2160x3840"):
                ar = "9:16"
            elif ar in ("4:3", "3:4", "3:2", "2:3"):
                ar = ar
            else:
                ar = "2048x2048"
        else: # 1k
            if ar in ("1:1", "1024x1024"):
                ar = "1024x1024"
            elif ar in ("16:9", "1280x720"):
                ar = "16:9"
            elif ar in ("9:16", "720x1280"):
                ar = "9:16"
            elif ar in ("4:3", "3:4", "3:2", "2:3"):
                ar = ar
            else:
                ar = "1024x1024"

        return ar, res

    @staticmethod
    def normalize_quality(quality: Optional[str] = "medium") -> str:
        """
        Chuẩn hóa mức độ chất lượng (Quality Steps):
        - low (draft / fast): Tối ưu tốc độ
        - medium (standard): Cân bằng tiêu chuẩn (Mặc định)
        - high (hd / ultra): Tối đa chi tiết vi mô và texture
        """
        q = (quality or "medium").lower().strip()
        if q in ("low", "fast", "draft"):
            return "low"
        elif q in ("medium", "standard", "normal"):
            return "medium"
        elif q in ("high", "hd", "ultra"):
            return "high"
        return "medium"

    @staticmethod
    def _optimize_prompt_for_diffusion(prompt: str) -> str:
        """
        Dịch tự động prompt tiếng Việt sang tiếng Anh nếu phát hiện ký tự tiếng Việt.
        Giúp mô hình AI không phải qua bước dịch LLM nội bộ (mất 30-45s),
        rút ngắn thời gian sinh ảnh từ 136s xuống ~85s, tránh hoàn toàn lỗi Cloudflare 504 Gateway Timeout!
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

    def generate_image_upstream(
        self,
        prompt: str,
        model: str = "gpt-image-2",
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
        Gửi yêu cầu tạo ảnh tới nhà cung cấp upstream qua Master API Key hoặc Provider Key riêng của tài khoản
        Hỗ trợ resolution (1k, 2k, 4k), quality (low, medium, high), reference (URL) và references (danh sách URL)
        Trả về (status_code, response_dict, latency_ms)
        """
        start_time = time.time()
        
        active_key = (provider_key or "").strip() or self.raw_api_key

        # Đảm bảo có API Key nếu không có provider_key truyền vào
        if not active_key:
            token = self.ensure_auth()
            # Tạo hoặc lấy key
            status, keys_resp = self._make_request(
                "/api/v1/api-keys",
                method="POST",
                payload={"name": "MintForge_Gateway_Auto", "quota_mode": "unlimited"},
                headers={"Authorization": f"Bearer {token}"}
            )
            if status in (200, 201) and "raw_key" in keys_resp:
                self.raw_api_key = keys_resp["raw_key"]
                active_key = self.raw_api_key

        # Chuẩn hóa resolution, quality và aspectRatio
        mapped_ar, mapped_res = self.normalize_resolution_and_aspect_ratio(aspect_ratio, resolution)
        mapped_qual = self.normalize_quality(quality)

        # Chuẩn hóa reference và references
        ref_list: List[str] = []
        if references and isinstance(references, list):
            ref_list.extend([str(r).strip() for r in references if r and str(r).strip()])
        if reference and isinstance(reference, str) and reference.strip() and reference.strip() not in ref_list:
            ref_list.append(reference.strip())

        # Tối ưu hóa prompt sang tiếng Anh nếu là tiếng Việt để mô hình AI xử lý trực tiếp không bị trễ dịch
        prompt_for_ai = self._optimize_prompt_for_diffusion(prompt)

        payload: Dict[str, Any] = {
            "prompt": prompt_for_ai,
            "model": model,
            "modelKey": model,
            "mode": "generation",
            "executionMode": execution_mode,
            "aspectRatio": mapped_ar,
            "resolution": mapped_res,
            "quality": mapped_qual,
            "count": count
        }

        if ref_list:
            upload_dir = settings.REFERENCES_UPLOAD_DIR
            os.makedirs(upload_dir, exist_ok=True)
            public_base = getattr(settings, "PUBLIC_API_URL", "https://api-gpt-images.nexoratech.com.vn").rstrip("/")
            resolved_refs: List[str] = []

            for r in ref_list:
                if not r:
                    continue
                r_str = str(r).strip()

                # Nếu đã là Base64 Data URI, giữ nguyên
                if r_str.startswith("data:image/"):
                    resolved_refs.append(r_str)
                    continue

                local_file_path = None

                # 1. Nếu là đường dẫn tương đối /static/uploads/references/...
                if "/static/uploads/references/" in r_str:
                    fname = r_str.split("/static/uploads/references/")[-1]
                    fpath = os.path.join(upload_dir, fname)
                    if os.path.exists(fpath):
                        local_file_path = fpath

                # 2. Nếu là URL công khai nội bộ domain này
                elif public_base in r_str or "nexoratech.com.vn" in r_str:
                    fname = r_str.split("/")[-1]
                    fpath = os.path.join(upload_dir, fname)
                    if os.path.exists(fpath):
                        local_file_path = fpath

                # 3. Nếu là URL bên ngoài (cdn.plenxai.com, imgur, link web...)
                elif r_str.startswith("http://") or r_str.startswith("https://"):
                    try:
                        url_hash = hashlib.md5(r_str.encode('utf-8')).hexdigest()[:16]
                        ext = ".jpg" if (".jpg" in r_str.lower() or ".jpeg" in r_str.lower()) else ".png"
                        saved_name = f"ext_{url_hash}{ext}"
                        saved_path = os.path.join(upload_dir, saved_name)
                        
                        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
                            req_dl = urllib.request.Request(r_str, headers={"User-Agent": self.USER_AGENT})
                            with urllib.request.urlopen(req_dl, timeout=15) as dl_resp:
                                with open(saved_path, "wb") as f_out:
                                    f_out.write(dl_resp.read())
                        local_file_path = saved_path
                    except Exception as e:
                        print(f"[ProviderClient] Không thể lưu ảnh tham chiếu ngoài ({r_str}): {e}")

                # 4. Chuyển đổi ảnh sang Base64 Data URI tối ưu kích thước để NCC không phải tải qua mạng
                if local_file_path and os.path.exists(local_file_path):
                    try:
                        from PIL import Image
                        import io
                        with Image.open(local_file_path) as im:
                            if im.mode != "RGB":
                                im = im.convert("RGB")
                            im.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                            buf = io.BytesIO()
                            im.save(buf, format="JPEG", quality=82, optimize=True)
                            b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
                            resolved_refs.append(f"data:image/jpeg;base64,{b64_str}")
                            continue
                    except Exception as opt_err:
                        with open(local_file_path, "rb") as bf:
                            bytes_data = bf.read()
                            b64_str = base64.b64encode(bytes_data).decode("utf-8")
                            resolved_refs.append(f"data:image/jpeg;base64,{b64_str}")
                            continue

                resolved_refs.append(r_str)

            payload["references"] = resolved_refs
            payload["reference"] = resolved_refs[0]

        headers = {
            "Authorization": f"Bearer {active_key}"
        }

        status, resp = self._make_request(
            "/v1/images/generations",
            method="POST",
            payload=payload,
            headers=headers,
            timeout=240
        )

        # Cơ chế Self-Healing: Nếu NCC báo "invalid or disabled API key", tự động re-auth và cấp key mới ngay lập tức
        err_str = str(resp.get("error", resp.get("message", resp))).lower()
        if status in (400, 401, 403) and ("invalid or disabled api key" in err_str or "api key" in err_str or status == 401):
            print(f"[ProviderClient] Phát hiện Provider Key không hợp lệ ({err_str}). Đang tự động cấp mới từ NCC...")
            try:
                token = self.ensure_auth()
                k_status, keys_resp = self._make_request(
                    "/api/v1/api-keys",
                    method="POST",
                    payload={"name": f"MintForge_Auto_{int(time.time())}", "quota_mode": "unlimited"},
                    headers={"Authorization": f"Bearer {token}"}
                )
                if k_status in (200, 201) and "raw_key" in keys_resp:
                    self.raw_api_key = keys_resp["raw_key"]
                    active_key = self.raw_api_key
                    headers["Authorization"] = f"Bearer {active_key}"
                    print(f"[ProviderClient] Đã cấp key mới thành công ({self.raw_api_key[:12]}...). Đang thử lại yêu cầu tạo ảnh...")
                    status, resp = self._make_request(
                        "/v1/images/generations",
                        method="POST",
                        payload=payload,
                        headers=headers,
                        timeout=240
                    )
            except Exception as e:
                print(f"[ProviderClient] Lỗi khi tự động cấp mới key: {e}")

        latency_ms = int((time.time() - start_time) * 1000)
        return status, resp, latency_ms


provider_client = ProviderClient()
