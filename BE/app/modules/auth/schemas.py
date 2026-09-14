from typing import Optional, List
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: str
    password: str
    link_api_key: Optional[bool] = False
    remember_me: Optional[bool] = True

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "SUPER_ADMIN"
    avatar_url: Optional[str] = None
    company_name: str = "MintForge Business Suite"
    is_active: bool = True
    permissions: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
