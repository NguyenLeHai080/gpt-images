from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class UserAccountResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    company_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    has_provider_key: bool = False
    provider_key_masked: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "MEMBER"
    company_name: str = "MintForge Business Suite"
    is_active: bool = True
    provider_api_key: Optional[str] = None

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    company_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    provider_api_key: Optional[str] = None

class UpdateProviderKeyRequest(BaseModel):
    provider_api_key: str

class UpdateRoleRequest(BaseModel):
    role: str

class ToggleStatusRequest(BaseModel):
    is_active: bool

class ChangePasswordRequest(BaseModel):
    new_password: str


class AccountStatsResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    super_admins: int
    admins: int
    developers: int
    members: int

class AccountsListResponse(BaseModel):
    users: List[UserAccountResponse]
    stats: AccountStatsResponse
