"""
Enterprise Rate Limiter & Anti-Brute-Force Guard
Ngăn chặn tấn công DoS / Brute-Force mật khẩu theo chuẩn OWASP
"""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Bộ nhớ lưu vết request: ip -> list of timestamps
_request_history: Dict[str, List[float]] = defaultdict(list)
# Bộ nhớ lưu vết đăng nhập thất bại: key (ip:identifier) -> list of failure timestamps
_failed_login_attempts: Dict[str, List[float]] = defaultdict(list)

MAX_REQUESTS_PER_MINUTE = 120
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300  # 5 phút

def get_client_ip(request: Request) -> str:
    """Lấy IP thực tế của client kể cả khi đi qua reverse proxy / load balancer"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def is_rate_limited(ip: str, limit: int = MAX_REQUESTS_PER_MINUTE, window: int = 60) -> bool:
    """Kiểm tra tần suất request theo thuật toán sliding window"""
    now = time.time()
    timestamps = [t for t in _request_history[ip] if now - t < window]
    _request_history[ip] = timestamps
    if len(timestamps) >= limit:
        return True
    _request_history[ip].append(now)
    return False

def check_login_lockout(ip: str, identifier: str) -> Tuple[bool, int]:
    """Kiểm tra xem IP hoặc tài khoản có đang bị khóa do nhập sai nhiều lần không"""
    now = time.time()
    key = f"{ip}:{identifier.lower().strip()}"
    recent_failures = [t for t in _failed_login_attempts[key] if now - t < LOCKOUT_DURATION_SECONDS]
    _failed_login_attempts[key] = recent_failures
    
    if len(recent_failures) >= MAX_LOGIN_ATTEMPTS:
        oldest_attempt = min(recent_failures)
        remaining_seconds = int(LOCKOUT_DURATION_SECONDS - (now - oldest_attempt))
        return True, max(remaining_seconds, 1)
    return False, 0

def record_failed_login(ip: str, identifier: str):
    """Ghi nhận một lần đăng nhập thất bại"""
    now = time.time()
    key = f"{ip}:{identifier.lower().strip()}"
    _failed_login_attempts[key].append(now)

def reset_login_attempts(ip: str, identifier: str):
    """Reset số lần thử khi đăng nhập thành công"""
    key = f"{ip}:{identifier.lower().strip()}"
    _failed_login_attempts.pop(key, None)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Miễn trừ kiểm tra cho docs và static endpoints
        path = request.url.path
        if path.startswith(("/docs", "/openapi.json", "/redoc", "/health", "/assets")):
            return await call_next(request)

        client_ip = get_client_ip(request)
        if is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau giây lát."
                },
                headers={"Retry-After": "60"}
            )
        return await call_next(request)