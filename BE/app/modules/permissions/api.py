from fastapi import APIRouter
from app.core.responses import success_response, error_response
from app.modules.permissions.schemas import RolePermissionsUpdate
from app.modules.permissions.services import permissions_service

router = APIRouter(prefix="/permissions", tags=["Permissions & Roles Matrix"])

@router.get("")
def get_permissions_matrix():
    data = permissions_service.get_permissions_matrix()
    return success_response(data.model_dump(), "Tải ma trận phân quyền thành công")

@router.put("/roles/{role_code}")
def update_role_permissions(role_code: str, payload: RolePermissionsUpdate):
    matrix = permissions_service.update_role_permissions(role_code, payload.permissions)
    return success_response(matrix, f"Cập nhật phân quyền cho vai trò '{role_code}' thành công")

@router.post("/reset-defaults")
def reset_default_permissions():
    matrix = permissions_service.reset_default_permissions()
    return success_response(matrix, "Khôi phục phân quyền mặc định thành công")
