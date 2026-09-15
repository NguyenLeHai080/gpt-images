import hashlib
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.modules.api_keys.models import ApiKey
from app.modules.api_keys.schemas import ApiKeyItem, CreateApiKeyRequest
from app.modules.auth.models import User

def hash_api_token(token: str) -> str:
    """Tạo mã băm SHA256 để tra cứu nhanh O(1) và an toàn"""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

class ApiKeyService:
    @staticmethod
    def list_keys(
        user_id: Optional[str] = None,
        is_admin: bool = False,
        target_user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> List[ApiKeyItem]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            query = db.query(ApiKey)
            if not is_admin:
                # Khách hàng thông thường: CHỈ xem được key của chính mình
                query = query.filter(ApiKey.user_id == user_id)
            else:
                # Admin / Super Admin: Có thể xem tất cả hoặc lọc theo tài khoản chỉ định
                if target_user_id and target_user_id != "all":
                    query = query.filter(ApiKey.user_id == target_user_id)

            records = query.order_by(ApiKey.created_at.desc()).all()

            # Map thông tin user để Super Admin biết key thuộc tài khoản nào
            user_ids = list(set([k.user_id for k in records if k.user_id]))
            users_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

            return [
                ApiKeyItem(
                    id=k.id,
                    name=k.name,
                    key_prefix=k.key_prefix,
                    status=k.status,
                    created_at=k.created_at.strftime("%Y-%m-%d %H:%M:%S") if isinstance(k.created_at, datetime) else str(k.created_at),
                    last_used=k.last_used_at or "Chưa sử dụng",
                    rate_limit=k.rate_limit,
                    user_id=k.user_id,
                    user_email=users_map[k.user_id].email if k.user_id in users_map else "N/A",
                    user_name=users_map[k.user_id].full_name if k.user_id in users_map else "Khách vãng lai",
                    user_role=users_map[k.user_id].role if k.user_id in users_map else None
                )
                for k in records
            ]
        finally:
            if close_session:
                db.close()

    @staticmethod
    def create_key(
        payload: CreateApiKeyRequest,
        user_id: Optional[str] = None,
        is_admin: bool = False,
        db: Optional[Session] = None
    ) -> ApiKeyItem:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # Nếu là Admin và chỉ định tài khoản khách cụ thể thì gán cho khách đó
            assigned_user_id = payload.user_id if (is_admin and payload.user_id) else user_id
            target_user = db.query(User).filter(User.id == assigned_user_id).first() if assigned_user_id else None

            secret_token = f"mf_live_sec_{uuid.uuid4().hex}"
            prefix = f"{secret_token[:16]}..."
            token_hash = hash_api_token(secret_token)

            new_record = ApiKey(
                id=f"key_{uuid.uuid4().hex[:8]}",
                user_id=assigned_user_id,
                name=payload.name,
                key_prefix=prefix,
                hashed_key=token_hash,
                rate_limit=payload.rate_limit or "60 req/min",
                status="active",
                last_used_at="Vừa xong",
                created_at=datetime.utcnow()
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)

            return ApiKeyItem(
                id=new_record.id,
                name=new_record.name,
                key_prefix=new_record.key_prefix,
                status=new_record.status,
                created_at=new_record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                last_used=new_record.last_used_at or "Chưa sử dụng",
                rate_limit=new_record.rate_limit,
                user_id=new_record.user_id,
                user_email=target_user.email if target_user else None,
                user_name=target_user.full_name if target_user else None,
                user_role=target_user.role if target_user else None,
                raw_key=secret_token
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def delete_key(key_id: str, db: Optional[Session] = None) -> bool:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            record = db.query(ApiKey).filter(ApiKey.id == key_id).first()
            if not record:
                return False
            db.delete(record)
            db.commit()
            return True
        finally:
            if close_session:
                db.close()

api_key_service = ApiKeyService()

