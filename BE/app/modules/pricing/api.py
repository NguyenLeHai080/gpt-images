from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.responses import success_response, error_response
from app.core.dependencies import get_db, get_optional_user, require_roles
from app.modules.auth.models import User
from app.modules.pricing.schemas import (
    CreateModelPricingRequest,
    UpdateModelPricingRequest,
    PricingSimulatorRequest,
)
from app.modules.pricing.services import pricing_service

router = APIRouter(prefix="/pricing", tags=["Pricing & Rate Cards"])

@router.get("")
def get_rate_cards(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Lấy bảng giá niêm yết các model AI.
    - SuperAdmin/Admin: thấy đầy đủ giá vốn NCC, lợi nhuận gộp và tỷ suất margin.
    - Khách hàng (User/Member): chỉ thấy giá bán API niêm yết và tỷ lệ token.
    """
    is_admin = bool(current_user and current_user.role in ["SUPER_ADMIN", "ADMIN"])
    pricing_list = pricing_service.get_all(db=db, is_admin=is_admin)
    return success_response([p.model_dump() for p in pricing_list], "Lấy bảng giá model thành công")

@router.post("")
def create_model_pricing(
    payload: CreateModelPricingRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    Thêm mới một model AI vào hệ thống (Chỉ dành riêng cho Super Admin).
    """
    try:
        created = pricing_service.create_pricing(db, payload)
        return success_response(created.model_dump(), f"Thêm mới model '{created.model}' thành công")
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

@router.put("/{model}")
def update_model_pricing(
    model: str,
    payload: UpdateModelPricingRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    Cập nhật cấu hình giá vốn NCC, giá bán API, token quy đổi cho model (Chỉ dành riêng cho Super Admin).
    """
    updated = pricing_service.update_pricing(db, model, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy model '{model}' để cấu hình giá"
        )
    return success_response(updated.model_dump(), f"Cập nhật bảng giá cho model '{model}' thành công")

@router.delete("/{model}")
def delete_model_pricing(
    model: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    Xóa model AI khỏi hệ thống (Chỉ dành riêng cho Super Admin).
    """
    if model == "gpt-image-2":
        all_models = pricing_service.get_all(db=db, is_admin=True)
        if len(all_models) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa model mặc định gpt-image-2 khi không còn model thay thế nào khác"
            )

    deleted = pricing_service.delete_pricing(db, model)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy model '{model}' để xóa"
        )
    return success_response({"model": model}, f"Đã xóa thành công model '{model}' khỏi hệ thống")

@router.post("/simulator")
def simulate_pricing(
    payload: PricingSimulatorRequest,
    db: Session = Depends(get_db)
):
    """Tính toán ước tính chi phí sản xuất theo lưu lượng ảnh hàng tháng và tỷ lệ cache hit."""
    result = pricing_service.calculate_simulation(payload, db=db)
    return success_response(result.model_dump(), "Tính toán chi phí thành công")
