from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.core.responses import success_response, error_response
from app.core.rate_limiter import get_client_ip, check_login_lockout, record_failed_login, reset_login_attempts
from app.modules.auth.schemas import LoginRequest
from app.modules.auth.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(payload: LoginRequest, request: Request):
    client_ip = get_client_ip(request)
    
    # Kiểm tra chống tấn công Brute-Force mật khẩu
    is_locked, remaining = check_login_lockout(client_ip, payload.email)
    if is_locked:
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "code": "LOGIN_LOCKED",
                "message": f"Tài khoản hoặc IP bị tạm khóa do thử sai quá 5 lần. Vui lòng thử lại sau {remaining} giây."
            },
            headers={"Retry-After": str(remaining)}
        )

    if not payload.email or not payload.password:
        return error_response("VALIDATION_ERROR", "Email và mật khẩu không được để trống")
    
    result = auth_service.authenticate(payload)
    if not result:
        record_failed_login(client_ip, payload.email)
        return error_response("AUTH_FAILED", "Email hoặc mật khẩu không chính xác")
        
    reset_login_attempts(client_ip, payload.email)
    return success_response(result.model_dump(), "Đăng nhập thành công")

from app.core.security import decode_access_token

@router.get("/me")
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    email = "admin@mintforge.vn"
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            email = payload["sub"]

    user = auth_service.get_user_by_email(email)
    if not user:
        # Fallback to first available user
        user = auth_service.get_user_by_email("admin@mintforge.vn")
        if not user:
            return error_response("NOT_FOUND", "Không tìm thấy người dùng")
            
    return success_response(user.model_dump(), "Lấy thông tin người dùng thành công")


