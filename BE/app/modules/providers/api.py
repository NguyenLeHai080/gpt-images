from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response
from app.core.dependencies import require_roles, get_current_user
from app.modules.auth.models import User
from app.modules.providers.schemas import (
    CreateProviderRequest,
    UpdateProviderRequest,
)
from app.modules.providers.services import providers_service

router = APIRouter(
    prefix="/providers",
    tags=["AI Upstream Providers (Quản trị NCC)"],
    dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))]
)

@router.get("")
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách tất cả các nhà cung cấp AI upstream (Xompet, OpenAI,...)"""
    is_admin = current_user.role in ["SUPER_ADMIN", "ADMIN"]
    providers = providers_service.get_all(db, include_full_key=is_admin)
    return success_response([p.model_dump() for p in providers], "Lấy danh sách nhà cung cấp thành công")

@router.get("/stats")
def get_provider_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy số liệu tổng quan về các nhà cung cấp (NCC chính, độ trễ, số lượng)"""
    stats = providers_service.get_stats(db)
    return success_response(stats.model_dump(), "Lấy thống kê NCC thành công")

@router.get("/{provider_id}")
def get_provider_detail(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))
):
    """Chi tiết nhà cung cấp (chỉ Admin)"""
    provider = providers_service.get_by_id(db, provider_id, include_full_key=True)
    if not provider:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp này")
    return success_response(provider.model_dump(), "Lấy chi tiết NCC thành công")

@router.post("", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def create_provider(
    payload: CreateProviderRequest,
    db: Session = Depends(get_db)
):
    """Thêm mới nhà cung cấp AI"""
    created = providers_service.create(db, payload)
    return success_response(created.model_dump(), "Thêm mới nhà cung cấp thành công")

@router.put("/{provider_id}", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def update_provider(
    provider_id: str,
    payload: UpdateProviderRequest,
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin nhà cung cấp"""
    updated = providers_service.update(db, provider_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp để cập nhật")
    return success_response(updated.model_dump(), "Cập nhật nhà cung cấp thành công")

@router.delete("/{provider_id}", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def delete_provider(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Xóa nhà cung cấp khỏi hệ thống (Không được xóa NCC chính)"""
    try:
        success = providers_service.delete(db, provider_id)
        if not success:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
        return success_response({"deleted": True}, "Đã xóa nhà cung cấp thành công")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{provider_id}/set-primary", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def set_primary_provider(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Chuyển đổi NCC này thành NCC chính (Primary) xử lý sinh ảnh cho toàn hệ thống"""
    updated = providers_service.set_primary(db, provider_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    return success_response(updated.model_dump(), f"Đã chuyển đổi '{updated.name}' thành Nhà Cung Cấp chính thành công")

@router.post("/{provider_id}/test-connection", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def test_provider_connection(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Kiểm tra kết nối thực tế (Ping Test) và đo độ trễ tới NCC"""
    try:
        result = providers_service.test_connection(db, provider_id)
        return success_response(result.model_dump(), result.message)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
