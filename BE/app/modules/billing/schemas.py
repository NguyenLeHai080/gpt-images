from typing import List, Optional
from pydantic import BaseModel

class WalletSummary(BaseModel):
    balance_amount: str = "24.702 đ"
    total_deposited: str = "4.331.500 đ"
    api_spent: str = "480 đ"
    currency: str = "VND"

class TransactionItem(BaseModel):
    id: str
    gateway: str  # "SePay" | "Bank QR"
    amount: str
    status: str  # "success" | "pending" | "failed"
    description: str
    created_at: str

class TopupRequest(BaseModel):
    amount: int
    gateway: str = "SePay"
