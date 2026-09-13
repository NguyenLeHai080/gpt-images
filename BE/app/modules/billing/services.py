from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.billing.models import Wallet, Transaction
from app.modules.billing.schemas import WalletSummary, TransactionItem

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

billing_service = BillingService()
