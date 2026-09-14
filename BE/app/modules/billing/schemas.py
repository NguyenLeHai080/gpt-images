from typing import List, Optional, Any
from pydantic import BaseModel

class WalletSummary(BaseModel):
    balance_amount: str = "0 đ"
    total_deposited: str = "0 đ"
    api_spent: str = "0 đ"
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

class BankAccountItem(BaseModel):
    id: str
    bank_name: str
    bank_code: str  # e.g. "CTG", "MB", "TCB"
    account_number: str
    account_holder: str
    branch: str
    qr_template: str = "compact2"
    is_primary: bool = True
    is_active: bool = True
    transfer_memo: Optional[str] = "GPT"
    qr_url: Optional[str] = None


class SepayTransactionItem(BaseModel):
    id: str
    gateway: str
    transaction_date: str
    account_number: str
    sub_account: Optional[str] = None
    amount_in: float
    amount_out: float = 0.0
    accumulated: float
    code: Optional[str] = None
    transaction_content: str
    reference_number: str
    status: str = "COMPLETED"

class SepayWebhookPayload(BaseModel):
    id: Optional[Any] = None
    gateway: Optional[str] = "VietinBank"
    transactionDate: Optional[str] = None
    accountNumber: Optional[str] = None
    code: Optional[str] = None
    content: Optional[str] = ""
    transferType: Optional[str] = "in"
    transferAmount: Optional[float] = 0.0
    accumulated: Optional[float] = 0.0
    subAccount: Optional[str] = None
    referenceCode: Optional[str] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None


class CreditConfigItem(BaseModel):
    min_deposit_amount: float = 50000.0
    max_deposit_amount: float = 50000000.0
    credit_exchange_rate: float = 1.0  # 1 VND = 1 Credit
    low_balance_warning_threshold: float = 30000.0
    bonus_tier_1_threshold: float = 1000000.0  # Nạp >= 1tr tặng 5%
    bonus_tier_1_pct: float = 5.0
    bonus_tier_2_threshold: float = 3000000.0  # Nạp >= 3tr tặng 10%
    bonus_tier_2_pct: float = 10.0
    auto_reconcile_sepay: bool = True
    allow_negative_balance: bool = False
