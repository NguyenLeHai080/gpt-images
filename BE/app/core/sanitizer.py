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