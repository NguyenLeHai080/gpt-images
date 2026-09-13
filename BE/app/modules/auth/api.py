from fastapi import APIRouter
from app.core.responses import success_response, error_response
from app.modules.auth.schemas import LoginRequest
from app.modules.auth.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(payload: LoginRequest):
    if not payload.email or not payload.password:
        return error_response("VALIDATION_ERROR", "Email và mật khẩu không được để trống")
    
    result = auth_service.authenticate(payload)
    if not result:
        return error_response("AUTH_FAILED", "Email hoặc mật khẩu không chính xác")
        
    return success_response(result.model_dump(), "Đăng nhập thành công")

@router.get("/me")
def get_current_user():
    user = auth_service.get_user_by_email("admin@mintforge.vn")
    if not user:
        return error_response("NOT_FOUND", "Không tìm thấy người dùng")
    return success_response(user.model_dump(), "Lấy thông tin người dùng thành công")
