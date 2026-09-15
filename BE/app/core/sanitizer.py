"""
Input Sanitizer & Payload Size Limiter
Bảo vệ chống tấn công Payload DoS (CWE-400) và làm sạch dữ liệu đầu vào chống XSS
"""
import html
import re
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

MAX_PAYLOAD_SIZE = 25 * 1024 * 1024  # 25MB (cho phép upload ảnh phân giải cao)

def sanitize_text(val: str) -> str:
    """Làm sạch chuỗi ký tự, vô hiệu hóa các payload XSS và script độc hại"""
    if not isinstance(val, str):
        return val
    # Loại bỏ null bytes và control characters nguy hiểm
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', val)
    # Escape HTML entities để tránh render script
    return html.escape(cleaned.strip())

def scrub_upstream_leakage(text: str) -> str:
    """
    Bảo vệ chống do thám / 'đục' API:
    - Loại bỏ tuyệt đối upstream API keys (sk-..., mf_live_sec_...)
    - Xóa bỏ domain, IP và CDN của nhà cung cấp (xompet, cunai, shyfai, apimatou)
    - Ẩn tên nhà cung cấp gốc và chuyển thành Cụm AI Engine
    - Chuyển đổi các thông báo lỗi socket/connection pool thành thông báo tiêu chuẩn an toàn
    """
    if not text or not isinstance(text, str):
        return "" if text is None else str(text)

    s = text
    # 1. Che giấu API keys & Bearer tokens
    s = re.sub(r'sk-[A-Za-z0-9_\-]{8,}', 'sk-••••••••', s)
    s = re.sub(r'Bearer\s+[A-Za-z0-9_\-\.]{10,}', 'Bearer ••••••••', s, flags=re.IGNORECASE)
    s = re.sub(r'mf_live_sec_[A-Za-z0-9]{8,}', 'mf_••••••••', s)

    # 2. Xóa sạch Upstream Domains & CDN URLs
    s = re.sub(r'https?://[a-zA-Z0-9\-\.]*(xompet|cunai|shyfai|apimatou)[a-zA-Z0-9\-\.:/]*', 'https://api.mintforge.vn/v1', s, flags=re.IGNORECASE)
    s = re.sub(r'[a-zA-Z0-9\-\.]*(xompet|cunai|shyfai|apimatou)[a-zA-Z0-9\-\.]*', 'ai-gateway.mintforge.internal', s, flags=re.IGNORECASE)

    # 3. Ẩn tên thương hiệu nhà cung cấp gốc
    s = re.sub(r'Xompet(\s+AI\s+Gateway)?', 'AI Cluster Engine', s, flags=re.IGNORECASE)
    s = re.sub(r'Cunai(\s+Gateway)?', 'AI Gateway Engine', s, flags=re.IGNORECASE)

    # 4. Che giấu chi tiết lỗi mạng cấp thấp (Socket / ConnectionPool)
    if any(k in s for k in ("ConnectionPool", "Failed to establish a new connection", "Max retries exceeded", "ConnectTimeout", "ReadTimeout", "RemoteDisconnected", "urllib.error")):
        return "Cụm máy chủ AI tạm thời gián đoạn kết nối hoặc phản hồi chậm. Vui lòng thử lại sau giây lát."

    return s

class PayloadLimitMiddleware(BaseHTTPMiddleware):
    """Ngăn chặn kẻ tấn công gửi body payload khổng lồ làm sập RAM/Buffer của server"""
    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > MAX_PAYLOAD_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "success": False,
                            "code": "PAYLOAD_TOO_LARGE",
                            "message": f"Kích thước gói tin vượt quá giới hạn tối đa cho phép ({MAX_PAYLOAD_SIZE // 1024 // 1024}MB)."
                        }
                    )
            except ValueError:
                pass
                
        return await call_next(request)