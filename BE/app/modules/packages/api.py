from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.responses import success_response, error_response
from app.core.dependencies import get_current_user, require_roles
from app.modules.auth.models import User
from app.modules.packages.schemas import CreatePackageRequest, UpdatePackageRequest
from app.modules.packages.services import packages_service

router = APIRouter(prefix="/packages", tags=["Packages Management"])

@router.get("")
def get_packages(active_only: bool = Query(False)):
    """Lấy danh sách các gói nạp credit"""
    packages = packages_service.get_all(active_only=active_only)
    return success_response([p.model_dump() for p in packages], "Lấy danh sách gói thành công")

@router.get("/{package_id}")
def get_package(package_id: str):
    pkg = packages_service.get_by_id(package_id)
    if not pkg:
        return error_response("NOT_FOUND", "Không tìm thấy gói credit tương ứng")
    return success_response(pkg.model_dump(), "Lấy thông tin gói thành công")

@router.post("", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def create_package(payload: CreatePackageRequest, current_user: User = Depends(get_current_user)):
    new_pkg = packages_service.create(payload)
    return success_response(new_pkg.model_dump(), "Tạo gói credit thành công")

@router.put("/{package_id}", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def update_package(package_id: str, payload: UpdatePackageRequest, current_user: User = Depends(get_current_user)):
    updated = packages_service.update(package_id, payload)
    if not updated:
        return error_response("NOT_FOUND", "Không tìm thấy gói credit để cập nhật")
    return success_response(updated.model_dump(), "Cập nhật gói credit thành công")

@router.delete("/{package_id}", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def delete_package(package_id: str, current_user: User = Depends(get_current_user)):
    success = packages_service.delete(package_id)
    if not success:
        return error_response("NOT_FOUND", "Không tìm thấy gói credit để xóa")
    return success_response({"deleted_id": package_id}, "Xóa gói credit thành công")
