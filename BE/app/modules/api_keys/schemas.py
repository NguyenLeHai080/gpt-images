from typing import List, Optional
from pydantic import BaseModel

class ApiKeyItem(BaseModel):
    id: str
    name: str
    key_prefix: str
    status: str = "active"  # "active" | "inactive" | "expired"
    created_at: str
    last_used: Optional[str] = None
    rate_limit: str = "60 req/min"
    user_id: Optional[str] = None
    raw_key: Optional[str] = None

class CreateApiKeyRequest(BaseModel):
    name: str
    rate_limit: Optional[str] = "60 req/min"

