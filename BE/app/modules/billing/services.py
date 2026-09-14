from typing import List, Optional
import re
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.auth.models import User
from app.modules.billing.models import Wallet, Transaction, SepayWebhookLog
from app.modules.billing.schemas import (
    WalletSummary,
    TransactionItem,
    BankAccountItem,
    SepayTransactionItem,
    SepayWebhookPayload,
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
                account_number="109873538727",
                account_holder="NGUYEN LE HAI",
                branch="Chi nhánh VietinBank",
                qr_template="compact2",
                is_primary=True,
                is_active=True
            )
        ]

    @staticmethod
    def get_sepay_transactions(db: Optional[Session] = None) -> List[SepayTransactionItem]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            logs = db.query(SepayWebhookLog).order_by(SepayWebhookLog.created_at.desc()).limit(50).all()
            if logs:
                return [
                    SepayTransactionItem(
                        id=f"sp_{l.sepay_id or l.id[:8]}",
                        gateway=l.gateway or "SePay VietinBank",
                        transaction_date=l.created_at.strftime("%d/%m/%Y %H:%M:%S") if isinstance(l.created_at, datetime) else str(l.created_at),
                        account_number=l.account_number or "109873538727",
                        sub_account="GPT-IMAGES",
                        amount_in=l.transfer_amount,
                        amount_out=0.0,
                        accumulated=l.accumulated,
                        code=l.matched_user_id,
                        transaction_content=l.content or "",
                        reference_number=l.reference_code or f"REF_{l.id[:8]}",
                        status="COMPLETED" if l.status == "PROCESSED" else l.status
                    )
                    for l in logs
                ]

            return [
                SepayTransactionItem(
                    id="sp_987123",
                    gateway="SePay VietinBank",
                    transaction_date="13/09/2026 23:45:10",
                    account_number="109873538727",
                    sub_account="GPT-IMAGES",
                    amount_in=2000000.0,
                    amount_out=0.0,
                    accumulated=4331500.0,
                    code="GPT user_admin_01",
                    transaction_content="SePay VietinBank GPT user_admin_01",
                    reference_number="FT26257891238491",
                    status="COMPLETED"
                ),
                SepayTransactionItem(
                    id="sp_987099",
                    gateway="SePay VietinBank",
                    transaction_date="12/09/2026 14:15:22",
                    account_number="109873538727",
                    sub_account="GPT-IMAGES",
                    amount_in=1500000.0,
                    amount_out=0.0,
                    accumulated=2331500.0,
                    code="GPT user_dev_01",
                    transaction_content="Chuyen khoan nap tien API GPT user_dev_01",
                    reference_number="FT26256192837102",
                    status="COMPLETED"
                ),
                SepayTransactionItem(
                    id="sp_986950",
                    gateway="SePay VietinBank",
                    transaction_date="10/09/2026 09:30:00",
                    account_number="109873538727",
                    sub_account="GPT-IMAGES",
                    amount_in=831500.0,
                    amount_out=0.0,
                    accumulated=831500.0,
                    code="GPT user_admin_01",
                    transaction_content="Nap credit qua VietQR GPT user_admin_01",
                    reference_number="FT26254109283749",
                    status="COMPLETED"
                )
            ]
        finally:
            if close_session:
                db.close()

    @staticmethod
    def process_sepay_webhook(payload: SepayWebhookPayload, db: Optional[Session] = None) -> dict:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            content = (payload.content or "").strip()
            transfer_type = (payload.transferType or "in").lower()
            amount = float(payload.transferAmount or 0.0)

            # 1. Chỉ xử lý dòng tiền vào tài khoản
            if transfer_type != "in":
                return {
                    "success": True,
                    "message": "Ignored: transferType is not 'in'",
                    "processed": False
                }

            # 2. Phân luồng theo mã tiền tố của gpt-images:
            # Hỗ trợ: GPT <USER_ID>, GPT<USER_ID>, MF NAP <USER_ID>, GPTIMG <USER_ID>
            pattern = r'(?:GPT|MF\s*NAP|GPTIMG)\s*([a-zA-Z0-9_\-]+)'
            match = re.search(pattern, content, re.IGNORECASE)

            # Nếu KHÔNG chứa tiền tố của gpt-images (nghĩa là thuộc web Meridians hoặc chuyển khoản cá nhân khác):
            # Trả về ngay HTTP 200 {success: true} để SePay xác nhận thành công và không gửi lại,
            # hoàn toàn không can thiệp vào số dư ví của gpt-images!
            if not match:
                log = SepayWebhookLog(
                    sepay_id=str(payload.id) if payload.id else None,
                    gateway=payload.gateway or "VietinBank",
                    account_number=payload.accountNumber or "109873538727",
                    transfer_type=payload.transferType or "in",
                    transfer_amount=amount,
                    accumulated=float(payload.accumulated or 0.0),
                    content=content,
                    reference_code=payload.referenceCode or payload.reference_number,
                    status="IGNORED",
                    matched_user_id=None,
                    raw_payload=json.dumps(payload.model_dump(), default=str)
                )
                db.add(log)
                db.commit()
                return {
                    "success": True,
                    "message": "Ignored: transaction not intended for gpt-images (belongs to another app or personal)",
                    "processed": False
                }

            raw_user_token = match.group(1).strip()

            # 3. Tìm User và Wallet tương ứng
            target_user = db.query(User).filter(
                (User.id == raw_user_token) |
                (User.email.ilike(f"{raw_user_token}%"))
            ).first()

            wallet = None
            if target_user:
                wallet = db.query(Wallet).filter(Wallet.user_id == target_user.id).first()

            # Fallback nếu test hoặc nạp vào ví admin mặc định
            if not wallet:
                wallet = db.query(Wallet).first()

            if not wallet:
                wallet = Wallet(
                    id="wallet_default",
                    user_id=target_user.id if target_user else None,
                    balance=0.0,
                    total_deposited=0.0,
                    api_spent=0.0,
                    currency="VND"
                )
                db.add(wallet)
                db.flush()

            # 4. Cộng số dư và tổng nạp vào ví
            wallet.balance += amount
            wallet.total_deposited += amount
            wallet.updated_at = datetime.utcnow()

            # 5. Ghi log giao dịch vào bảng transactions
            tx_id = f"TX-{payload.id}" if payload.id else f"TX-{uuid.uuid4().hex[:8].upper()}"
            tx = Transaction(
                id=tx_id,
                wallet_id=wallet.id,
                amount=amount,
                gateway=f"SePay {payload.gateway or 'VietinBank'}",
                status="success",
                description=f"Nạp tiền tự động SePay VietQR: {content}",
                created_at=datetime.utcnow()
            )
            db.add(tx)

            # 6. Ghi log SePay Webhook
            log = SepayWebhookLog(
                sepay_id=str(payload.id) if payload.id else None,
                gateway=payload.gateway or "VietinBank",
                account_number=payload.accountNumber or "109873538727",
                transfer_type=payload.transferType or "in",
                transfer_amount=amount,
                accumulated=float(payload.accumulated or 0.0),
                content=content,
                reference_code=payload.referenceCode or payload.reference_number,
                status="PROCESSED",
                matched_user_id=target_user.id if target_user else raw_user_token,
                raw_payload=json.dumps(payload.model_dump(), default=str)
            )
            db.add(log)

            db.commit()

            return {
                "success": True,
                "message": f"Nạp thành công {amount:,.0f} đ vào ví",
                "processed": True,
                "transaction_id": tx_id,
                "user_id": target_user.id if target_user else raw_user_token,
                "balance": wallet.balance
            }
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "processed": False
            }
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_credit_config() -> CreditConfigItem:
        return CreditConfigItem()

billing_service = BillingService()

