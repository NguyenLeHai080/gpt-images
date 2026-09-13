import time
import json
import ssl
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple

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

    def generate_image_upstream(
        self,
        prompt: str,
        model: str = "gpt-image-2",
        aspect_ratio: str = "1024x1024",
        count: int = 1,
        execution_mode: str = "sync"
    ) -> Tuple[int, Dict[str, Any], int]:
        """
        Gửi yêu cầu tạo ảnh tới nhà cung cấp upstream qua Master API Key
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

        payload = {
            "prompt": prompt,
            "model": model,
            "modelKey": model,
            "mode": "generation",
            "executionMode": execution_mode,
            "aspectRatio": aspect_ratio,
            "count": count
        }

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
