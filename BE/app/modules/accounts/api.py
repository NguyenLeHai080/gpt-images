from typing import Optional
from fastapi import APIRouter, Query, Depends, HTTPException, status
from app.core.responses import success_response, error_response
from app.core.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.accounts.schemas import (
    CreateUserRequest,
    UpdateUserRequest,
    UpdateRoleRequest,
    ToggleStatusRequest,
    ChangePasswordRequest
)
from app.modules.accounts.services import accounts_service

router = APIRouter(prefix="/accounts", tags=["Accounts Management"])

@router.get("")
def list_accounts(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên, email, công ty"),
    role: Optional[str] = Query(None, description="Lọc theo vai trò (SUPER_ADMIN, ADMIN, DEVELOPER, MEMBER)"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái (active, inactive)")
):
    users, stats = accounts_service.get_accounts(search=search, role=role, status=status)
    return success_response(
        {
            "users": [u.model_dump() for u in users],
            "stats": stats.model_dump()
        },
        "Tải danh sách tài khoản thành công"
    )

@router.post("")
def create_account(payload: CreateUserRequest):
    user = accounts_service.create_user(payload)
    if not user:
        return error_response("EMAIL_EXISTS", f"Email '{payload.email}' đã tồn tại trong hệ thống")
    return success_response(user.model_dump(), "Tạo tài khoản mới thành công")

@router.put("/{user_id}")
def update_account(user_id: str, payload: UpdateUserRequest):
    try:
        user = accounts_service.update_user(user_id, payload)
        if not user:
            return error_response("NOT_FOUND", "Không tìm thấy người dùng")
        return success_response(user.model_dump(), "Cập nhật thông tin tài khoản thành công")
    except ValueError as e:
        return error_response("VALIDATION_ERROR", str(e))

@router.post("/{user_id}/password")
def change_user_password(user_id: str, payload: ChangePasswordRequest):
    if not payload.new_password or len(payload.new_password.strip()) < 6:
        return error_response("WEAK_PASSWORD", "Mật khẩu mới phải từ 6 ký tự trở lên")

    success = accounts_service.change_password(user_id, payload.new_password.strip())
    if not success:
        return error_response("NOT_FOUND", "Không tìm thấy người dùng để đổi mật khẩu")
    return success_response({"user_id": user_id}, "Đổi mật khẩu tài khoản thành công")

@router.patch("/{user_id}/role")
def update_user_role(user_id: str, payload: UpdateRoleRequest):
    try:
        user = accounts_service.update_role(user_id, payload.role)
        if not user:
            return error_response("NOT_FOUND", "Không tìm thấy người dùng")
        return success_response(user.model_dump(), "Cập nhật vai trò tài khoản thành công")
    except ValueError as e:
        return error_response("VALIDATION_ERROR", str(e))

@router.patch("/{user_id}/status")
def toggle_user_status(user_id: str, payload: ToggleStatusRequest):
    try:
        user = accounts_service.toggle_status(user_id, payload.is_active)
        if not user:
            return error_response("NOT_FOUND", "Không tìm thấy người dùng")
        status_text = "kích hoạt" if payload.is_active else "vô hiệu hóa"
        return success_response(user.model_dump(), f"Đã {status_text} tài khoản thành công")
    except ValueError as e:
        return error_response("VALIDATION_ERROR", str(e))

@router.delete("/{user_id}")
def delete_account(user_id: str):
    success = accounts_service.delete_user(user_id)
    if not success:
        return error_response("DELETE_FAILED", "Không thể xóa tài khoản này (hoặc tài khoản là Super Admin gốc)")
    return success_response({"deleted_id": user_id}, "Đã xóa tài khoản thành công")
