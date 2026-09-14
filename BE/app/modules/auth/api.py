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

from fastapi import Depends
from app.core.dependencies import get_current_user as auth_required_user
from app.modules.auth.models import User as UserModel

@router.get("/me")
def get_current_user_profile(current_user: UserModel = Depends(auth_required_user)):
    user_schema = auth_service.get_user_by_email(current_user.email)
    if not user_schema:
        return error_response("NOT_FOUND", "Không tìm thấy người dùng")
        
    return success_response(user_schema.model_dump(), "Lấy thông tin người dùng thành công")


