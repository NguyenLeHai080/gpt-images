import uuid
from datetime import datetime
from typing import List
from app.modules.api_keys.schemas import ApiKeyItem, CreateApiKeyRequest

# In-memory mock list of 28 keys (matching "28 key đang quản lý")
MOCK_API_KEYS: List[ApiKeyItem] = [
    ApiKeyItem(
        id=f"key_{i+1:03d}",
        name=f"Production App Key #{i+1}" if i < 10 else f"Service Worker Key #{i+1}",
        key_prefix=f"mf_live_{uuid.uuid4().hex[:8]}...",
        status="active",
        created_at="2026-08-01 10:00:00",
        last_used="14:19:09 12/9/2026",
        rate_limit="120 req/min" if i == 0 else "60 req/min"
    )
    for i in range(28)
]

class ApiKeyService:
    @staticmethod
    def list_keys() -> List[ApiKeyItem]:
        return MOCK_API_KEYS

    @staticmethod
    def create_key(payload: CreateApiKeyRequest) -> ApiKeyItem:
        new_key = ApiKeyItem(
            id=f"key_{len(MOCK_API_KEYS)+1:03d}",
            name=payload.name,
            key_prefix=f"mf_live_{uuid.uuid4().hex[:8]}...",
            status="active",
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            last_used="Chưa sử dụng",
            rate_limit=payload.rate_limit or "60 req/min"
        )
        MOCK_API_KEYS.insert(0, new_key)
        return new_key

api_key_service = ApiKeyService()
