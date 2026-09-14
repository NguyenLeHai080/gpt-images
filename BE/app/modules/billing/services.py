from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.billing.models import Wallet, Transaction
from app.modules.billing.schemas import (
    WalletSummary,
    TransactionItem,
    BankAccountItem,
    SepayTransactionItem,
    CreditConfigItem,
)

class BillingService:
    @staticmethod
    def get_wallet(db: Optional[Session] = None) -> WalletSummary:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            record = db.query(Wallet).first()
            if not record:
                return WalletSummary()

            # Format formatted numbers
            bal_str = f"{int(record.balance):,}".replace(",", ".") + " đ"
            dep_str = f"{int(record.total_deposited):,}".replace(",", ".") + " đ"
            spent_str = f"{int(record.api_spent):,}".replace(",", ".") + " đ"

            return WalletSummary(
                balance=record.balance,
                balance_amount=bal_str,
                total_deposited=dep_str,
                api_spent=spent_str,
                currency=record.currency
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_transactions(db: Optional[Session] = None) -> List[TransactionItem]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            records = db.query(Transaction).order_by(Transaction.created_at.desc()).all()
            return [
                TransactionItem(
                    id=t.id,
                    gateway=t.gateway,
                    amount=f"+ {int(t.amount):,}".replace(",", ".") + " đ",
                    status=t.status,
                    description=t.description,
                    created_at=t.created_at.strftime("%H:%M:%S %d/%m/%Y") if isinstance(t.created_at, datetime) else str(t.created_at)
                )
                for t in records
            ]
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_bank_accounts() -> List[BankAccountItem]:
        return [
            BankAccountItem(
                id="bank_01",
                bank_name="Ngân Hàng TMCP Công Thương Việt Nam (VietinBank)",
                bank_code="ICB",
                account_number="108876543210",
                account_holder="CONG TY CP CONG NGHE MINTFORGE",
                branch="Chi nhánh Hoàn Kiếm, Hà Nội",
                qr_template="compact2",
                is_primary=True,
                is_active=True
            ),
            BankAccountItem(
                id="bank_02",
                bank_name="Ngân Hàng TMCP Quân Đội (MB Bank)",
                bank_code="MB",
                account_number="999988887777",
                account_holder="CONG TY CP CONG NGHE MINTFORGE",
                branch="Chi nhánh Sở Giao Dịch 1",
                qr_template="compact2",
                is_primary=False,
                is_active=True
            )
        ]

    @staticmethod
    def get_sepay_transactions() -> List[SepayTransactionItem]:
        return [
            SepayTransactionItem(
                id="sp_987123",
                gateway="SePay VietQR",
                transaction_date="13/09/2026 23:45:10",
                account_number="108876543210",
                sub_account="MINTFORGE",
                amount_in=2000000.0,
                amount_out=0.0,
                accumulated=4331500.0,
                code="MF_NAP_ADMIN",
                transaction_content="SePay MB9999 MF_NAP_ADMIN",
                reference_number="FT26257891238491",
                status="COMPLETED"
            ),
            SepayTransactionItem(
                id="sp_987099",
                gateway="SePay VietinBank",
                transaction_date="12/09/2026 14:15:22",
                account_number="108876543210",
                sub_account="MINTFORGE",
                amount_in=1500000.0,
                amount_out=0.0,
                accumulated=2331500.0,
                code="MF_NAP_DEV01",
                transaction_content="Chuyen khoan nap tien API MF_NAP_DEV01",
                reference_number="FT26256192837102",
                status="COMPLETED"
            ),
            SepayTransactionItem(
                id="sp_986950",
                gateway="SePay Auto QR",
                transaction_date="10/09/2026 09:30:00",
                account_number="999988887777",
                sub_account="MINTFORGE",
                amount_in=831500.0,
                amount_out=0.0,
                accumulated=831500.0,
                code="MF_NAP_MEM01",
                transaction_content="Nap credit qua VietQR MF_NAP_MEM01",
                reference_number="FT26254109283749",
                status="COMPLETED"
            )
        ]

    @staticmethod
    def get_credit_config() -> CreditConfigItem:
        return CreditConfigItem()

billing_service = BillingService()
