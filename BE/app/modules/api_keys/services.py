import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.modules.api_keys.models import ApiKey
from app.modules.api_keys.schemas import ApiKeyItem, CreateApiKeyRequest

class ApiKeyService:
    @staticmethod
    def list_keys(db: Optional[Session] = None) -> List[ApiKeyItem]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            records = db.query(ApiKey).order_by(ApiKey.created_at.asc()).all()
            return [
                ApiKeyItem(
                    id=k.id,
                    name=k.name,
                    key_prefix=k.key_prefix,
                    status=k.status,
                    created_at=k.created_at.strftime("%Y-%m-%d %H:%M:%S") if isinstance(k.created_at, datetime) else str(k.created_at),
                    last_used=k.last_used_at or "Chưa sử dụng",
                    rate_limit=k.rate_limit
                )
                for k in records
            ]
        finally:
            if close_session:
                db.close()

    @staticmethod
    def create_key(payload: CreateApiKeyRequest, db: Optional[Session] = None) -> ApiKeyItem:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            secret_token = f"mf_live_sec_{uuid.uuid4().hex}"
            prefix = f"{secret_token[:16]}..."
            new_record = ApiKey(
                id=f"key_{uuid.uuid4().hex[:8]}",
                name=payload.name,
                key_prefix=prefix,
                hashed_key=get_password_hash(secret_token),
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
                rate_limit=new_record.rate_limit
            )
        finally:
            if close_session:
                db.close()

api_key_service = ApiKeyService()
