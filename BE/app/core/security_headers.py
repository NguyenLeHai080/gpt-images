"""
Security Headers Middleware - OWASP Recommended Protections
Chống XSS, Clickjacking, MIME-sniffing, Do thám thông tin máy chủ (Fingerprinting)
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: blob: https://fastapi.tiangolo.com https:; "
        "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* https:;"
    )
}

STRIPPED_HEADERS = ["server", "x-powered-by"]

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        
        # Inject OWASP security headers
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
            
        # Strip server information headers (Anti-Fingerprinting)
        for header in STRIPPED_HEADERS:
            if header in response.headers:
                del response.headers[header]
                
        return response