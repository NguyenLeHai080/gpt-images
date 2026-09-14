from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.api_keys.schemas import CreateApiKeyRequest
from app.modules.api_keys.services import api_key_service

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

def get_current_user_from_request(request: Request, db: Session) -> User:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.email == payload["sub"]).first()
            if user:
                return user
    # Fallback to default admin
    return db.query(User).first()

@router.get("")
def get_api_keys(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    is_admin = user.role in ("SUPER_ADMIN", "ADMIN") if user else True
    user_id = user.id if user else None
    keys = api_key_service.list_keys(user_id=user_id, is_admin=is_admin, db=db)
    return success_response(keys, "Lấy danh sách API Keys thành công")

@router.post("")
def create_api_key(payload: CreateApiKeyRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    user_id = user.id if user else None
    new_key = api_key_service.create_key(payload, user_id=user_id, db=db)
    return success_response(new_key.model_dump(), "Tạo API Key mới thành công", status_code=201)

@router.delete("/{key_id}")
def delete_api_key(key_id: str, db: Session = Depends(get_db)):
    success = api_key_service.delete_key(key_id, db=db)
    if not success:
        return success_response({"id": key_id}, "Không tìm thấy API Key hoặc đã bị xóa", status_code=404)
    return success_response({"id": key_id}, "Đã xóa API Key thành công")

