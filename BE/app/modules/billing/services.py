from typing import List
from app.modules.billing.schemas import WalletSummary, TransactionItem, TopupRequest

MOCK_TRANSACTIONS: List[TransactionItem] = [
    TransactionItem(
        id="tx_sep_9918",
        gateway="SePay",
        amount="+ 500.000 đ",
        status="success",
        description="Nạp tiền ví API qua cổng SePay tự động",
        created_at="10:30:15 10/9/2026"
    ),
    TransactionItem(
        id="tx_qr_8812",
        gateway="Bank QR",
        amount="+ 2.000.000 đ",
        status="success",
        description="Chuyển khoản Vietcombank QR Code",
        created_at="15:45:00 01/9/2026"
    ),
    TransactionItem(
        id="tx_sep_7721",
        gateway="SePay",
        amount="+ 1.831.500 đ",
        status="success",
        description="Gói doanh nghiệp Enterprise Pack",
        created_at="09:00:22 15/8/2026"
    )
]

class BillingService:
    @staticmethod
    def get_wallet() -> WalletSummary:
        return WalletSummary()

    @staticmethod
    def get_transactions() -> List[TransactionItem]:
        return MOCK_TRANSACTIONS

billing_service = BillingService()
