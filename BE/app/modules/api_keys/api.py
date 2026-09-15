from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response
from app.core.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.api_keys.schemas import CreateApiKeyRequest
from app.modules.api_keys.services import api_key_service
from app.modules.api_keys.models import ApiKey

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.get("")
def get_api_keys(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
    target_user_id = request.query_params.get("user_id")
    # Nếu là Admin: mặc định xem tất cả (hoặc lọc theo user_id nếu có)
    # Nếu là Khách hàng / non-admin: CHỈ xem của chính mình
    keys = api_key_service.list_keys(
        user_id=current_user.id,
        is_admin=is_admin,
        target_user_id=target_user_id,
        db=db
    )
    return success_response(keys, "Lấy danh sách API Keys thành công")

@router.post("")
def create_api_key(
    payload: CreateApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
    new_key = api_key_service.create_key(
        payload,
        user_id=current_user.id,
        is_admin=is_admin,
        db=db
    )
    return success_response(new_key.model_dump(), "Tạo API Key mới thành công", status_code=201)

@router.delete("/{key_id}")
def delete_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra quyền sở hữu khóa: Admin hoặc chính chủ nhân của khóa
    is_admin = current_user.role in ("SUPER_ADMIN", "ADMIN")
    target_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not target_key:
        raise HTTPException(status_code=404, detail="Không tìm thấy API Key hoặc đã bị xóa")

    if not is_admin and target_key.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa API Key của người khác")

    success = api_key_service.delete_key(key_id, db=db)
    return success_response({"id": key_id}, "Đã xóa API Key thành công")

