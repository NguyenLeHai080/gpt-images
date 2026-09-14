import time
import json
import ssl
import os
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple, List
from app.core.config import settings

class ProviderClient:
    BASE_URL = "https://api.leeh.dev"
    DEFAULT_USER = "willownelson"
    DEFAULT_PASS = "123123123"
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    def __init__(self):
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        self.access_token: Optional[str] = None
        self.raw_api_key: Optional[str] = "sk-HJMEUHF7MPUXCYJFHW5R5CNSRGV5XHQQOC5EHKU2LWXUBOOLDHGA===="
        self.token_expiry: float = 0.0

    def _make_request(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 70
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
    def normalize_quality(quality: Optional[str] = "high") -> str:
        """
        Chuẩn hóa mức độ chất lượng (Quality Steps):
        - low (draft / fast): Tối ưu tốc độ
        - medium (standard): Cân bằng tiêu chuẩn
        - high (hd / ultra): Tối đa chi tiết vi mô và texture
        """
        q = (quality or "high").lower().strip()
        if q in ("low", "fast", "draft"):
            return "low"
        elif q in ("medium", "standard", "normal"):
            return "medium"
        elif q in ("high", "hd", "ultra"):
            return "high"
        return "high"

    def generate_image_upstream(
        self,
        prompt: str,
        model: str = "gpt-image-2",
        aspect_ratio: str = "1024x1024",
        resolution: str = "1k",
        quality: str = "high",
        reference: Optional[str] = None,
        references: Optional[List[str]] = None,
        count: int = 1,
        execution_mode: str = "sync"
    ) -> Tuple[int, Dict[str, Any], int]:
        """
        Gửi yêu cầu tạo ảnh tới nhà cung cấp upstream qua Master API Key
        Hỗ trợ resolution (1k, 2k, 4k), quality (low, medium, high), reference (URL) và references (danh sách URL)
        Trả về (status_code, response_dict, latency_ms)
        """
        start_time = time.time()
        
        # Đảm bảo có API Key
        if not self.raw_api_key:
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

        # Chuẩn hóa resolution, quality và aspectRatio
        mapped_ar, mapped_res = self.normalize_resolution_and_aspect_ratio(aspect_ratio, resolution)
        mapped_qual = self.normalize_quality(quality)

        # Chuẩn hóa reference và references
        ref_list: List[str] = []
        if references and isinstance(references, list):
            ref_list.extend([str(r).strip() for r in references if r and str(r).strip()])
        if reference and isinstance(reference, str) and reference.strip() and reference.strip() not in ref_list:
            ref_list.append(reference.strip())

        payload: Dict[str, Any] = {
            "prompt": prompt,
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
            resolved_refs: List[str] = []
            for r in ref_list:
                if r and "/static/uploads/references/" in r:
                    fname = r.split("/static/uploads/references/")[-1]
                    fpath = os.path.join(upload_dir, fname)
                    if os.path.exists(fpath):
                        with open(fpath, "rb") as bf:
                            bytes_data = bf.read()
                            fext = os.path.splitext(fname)[1].lower().lstrip(".")
                            mime = f"image/{fext}" if fext != "jpg" else "image/jpeg"
                            resolved_refs.append(f"data:{mime};base64,{base64.b64encode(bytes_data).decode('utf-8')}")
                            continue
                resolved_refs.append(r)

            payload["references"] = resolved_refs
            payload["reference"] = resolved_refs[0]

        headers = {
            "Authorization": f"Bearer {self.raw_api_key}"
        }

        status, resp = self._make_request(
            "/v1/images/generations",
            method="POST",
            payload=payload,
            headers=headers,
            timeout=120
        )

        latency_ms = int((time.time() - start_time) * 1000)
        return status, resp, latency_ms

provider_client = ProviderClient()
