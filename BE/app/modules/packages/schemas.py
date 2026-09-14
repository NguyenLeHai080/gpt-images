from typing import Optional
from pydantic import BaseModel

class PackageItem(BaseModel):
    id: str
    name: str
    price: float
    credits: int
    bonus_credits: int = 0
    discount_pct: int = 0
    badge: Optional[str] = None
    description: str
    is_popular: bool = False
    is_active: bool = True
    features: list[str] = []

class CreatePackageRequest(BaseModel):
    name: str
    price: float
    credits: int
    bonus_credits: int = 0
    discount_pct: int = 0
    badge: Optional[str] = None
    description: str
    is_popular: bool = False
    is_active: bool = True
    features: list[str] = []

class UpdatePackageRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    credits: Optional[int] = None
    bonus_credits: Optional[int] = None
    discount_pct: Optional[int] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    features: Optional[list[str]] = None
