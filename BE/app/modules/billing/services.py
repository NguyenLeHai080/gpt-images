from typing import List, Optional
import re
import json
import uuid
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.auth.models import User
from app.modules.billing.models import Wallet, Transaction, SepayWebhookLog, ProviderBudgetLog
from app.modules.billing.schemas import (
    WalletSummary,
    TransactionItem,
    BankAccountItem,
    SepayTransactionItem,
    SepayWebhookPayload,
    CreditConfigItem,
    ProviderBudgetOverview,
    ProviderBudgetLogItem,
)

import urllib.parse

class BillingService:
    @staticmethod
    def get_wallet(user_id: Optional[str] = None, is_admin: bool = False, db: Optional[Session] = None) -> WalletSummary:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            if is_admin:
                # Toàn hệ thống / Dòng tiền Doanh nghiệp
                bal = db.query(func.sum(Wallet.balance)).scalar() or 0.0
                dep = db.query(func.sum(Wallet.total_deposited)).scalar() or 0.0
                spent = db.query(func.sum(Wallet.api_spent)).scalar() or 0.0
                return WalletSummary(
                    balance_amount=f"{int(bal):,}".replace(",", ".") + " đ",
                    total_deposited=f"{int(dep):,}".replace(",", ".") + " đ",
                    api_spent=f"{int(spent):,}".replace(",", ".") + " đ",
                    currency="VND",
                    balance=bal,
                    available_images=int(bal // 150),
                    is_exhausted=(bal < 150)
                )

            record = None
            if user_id:
                record = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            
            if not record and user_id:
                # Tự động khởi tạo ví cho user nếu chưa có
                record = Wallet(
                    id=f"wallet_{uuid.uuid4().hex[:12]}",
                    user_id=user_id,
                    balance=0.0,
                    total_deposited=0.0,
                    api_spent=0.0,
                    currency="VND"
                )
                db.add(record)
                db.commit()
                db.refresh(record)
            elif not record:
                record = db.query(Wallet).first()

            if not record:
                return WalletSummary()

            # Format formatted numbers
            bal_val = record.balance if record else 0.0
            avail_imgs = int(bal_val // 150) if bal_val >= 0 else 0
            bal_str = f"{int(bal_val):,}".replace(",", ".") + " đ"
            dep_str = f"{int(record.total_deposited):,}".replace(",", ".") + " đ"
            spent_str = f"{int(record.api_spent):,}".replace(",", ".") + " đ"

            return WalletSummary(
                balance_amount=bal_str,
                total_deposited=dep_str,
                api_spent=spent_str,
                currency=record.currency,
                balance=bal_val,
                available_images=avail_imgs,
                is_exhausted=(bal_val < 150)
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_transactions(user_id: Optional[str] = None, is_admin: bool = False, db: Optional[Session] = None) -> List[TransactionItem]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            query = db.query(Transaction)
            if not is_admin and user_id:
                wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
                if wallet:
                    query = query.filter(Transaction.wallet_id == wallet.id)
                else:
                    return []

            records = query.order_by(Transaction.created_at.desc()).all()
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
    def get_bank_accounts(user_id: str = "user_admin_01") -> List[BankAccountItem]:
        memo = f"SEVQR GPT {user_id}"
        account_number = "109873538727"
        account_holder = "NGUYEN LE HAI"
        # Official VietQR High-Speed Cloudflare CDN (loads in < 500ms)
        qr_url = f"https://img.vietqr.io/image/vietinbank-{account_number}-compact2.png?addInfo={urllib.parse.quote(memo)}&accountName={urllib.parse.quote(account_holder)}"

        return [
            BankAccountItem(
                id="bank_01",
                bank_name="Ngân Hàng TMCP Công Thương Việt Nam (VietinBank)",
                bank_code="ICB",
                account_number=account_number,
                account_holder=account_holder,
                branch="Chi nhánh VietinBank",
                qr_template="compact2",
                is_primary=True,
                is_active=True,
                transfer_memo=memo,
                qr_url=qr_url
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
                        status="COMPLETED" if l.status == "PROCESSED" else l.status,
                        provider_cost=round(float(l.transfer_amount or 0) * (75.0 / 150.0)),
                        gross_profit=round(float(l.transfer_amount or 0) * (75.0 / 150.0)),
                        images_count=int((l.transfer_amount or 0) // 150)
                    )
                    for l in logs
                ]

            return []
        finally:
            if close_session:
                db.close()

    @staticmethod
    def clear_sepay_transactions(db: Optional[Session] = None) -> int:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True
        try:
            count = db.query(SepayWebhookLog).delete()
            db.commit()
            return count
        except Exception:
            db.rollback()
            raise
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
            # Hỗ trợ: SEVQR GPT <USER_ID>, SEVQR <USER_ID>, GPT <USER_ID>, MF NAP <USER_ID>
            pattern = r'(?:SEVQR\s*GPT|SEVQR\s*GPTIMG|SEVQR|GPT|MF\s*NAP|GPTIMG)\s*([a-zA-Z0-9_\-]+)'
            match = re.search(pattern, content, re.IGNORECASE)

            target_user = None
            if match:
                raw_user_token = match.group(1).strip()
                target_user = db.query(User).filter(
                    (User.id == raw_user_token) |
                    (User.id == f"user_{raw_user_token}") |
                    (User.id.ilike(f"%{raw_user_token}%")) |
                    (User.email.ilike(f"{raw_user_token}%")) |
                    (User.full_name.ilike(f"%{raw_user_token}%"))
                ).first()

            if not target_user:
                # Quét trực tiếp xem trong nội dung chuyển khoản có chứa mã user_id, hash id hoặc email của khách không
                all_users = db.query(User).all()
                for u in all_users:
                    token = u.id.replace("user_", "")
                    if u.id.lower() in content.lower() or (len(token) >= 6 and token.lower() in content.lower()):
                        target_user = u
                        break
                    username = u.email.split("@")[0].lower() if u.email else ""
                    if len(username) >= 4 and username in content.lower():
                        target_user = u
                        break

            # Nếu KHÔNG chứa tiền tố của gpt-images và không khớp bất kỳ user nào trong hệ thống:
            # Trả về ngay HTTP 200 {success: true} để SePay xác nhận thành công và không gửi lại
            if not target_user and not match:
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

            # 3. Tìm Wallet tương ứng
            wallet = None
            if target_user:
                wallet = db.query(Wallet).filter(Wallet.user_id == target_user.id).first()
                if not wallet:
                    wallet = Wallet(
                        id=f"wallet_{uuid.uuid4().hex[:12]}",
                        user_id=target_user.id,
                        balance=0.0,
                        total_deposited=0.0,
                        api_spent=0.0,
                        currency="VND"
                    )
                    db.add(wallet)
                    db.flush()
            else:
                # Fallback nếu test admin hoặc nạp chung
                wallet = db.query(Wallet).first()
                if not wallet:
                    wallet = Wallet(
                        id="wallet_default",
                        user_id=None,
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

    @staticmethod
    def get_provider_budget_overview(db: Optional[Session] = None) -> ProviderBudgetOverview:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            from app.modules.generations.provider_client import provider_client
            wallet_info = provider_client.get_wallet_balance()

            logs = db.query(ProviderBudgetLog).order_by(ProviderBudgetLog.created_at.desc()).limit(20).all()
            recent_topups = [
                ProviderBudgetLogItem(
                    id=l.id,
                    amount=l.amount,
                    budget_before=l.budget_before,
                    budget_after=l.budget_after,
                    note=l.note,
                    created_by=l.created_by,
                    created_at=l.created_at.strftime("%H:%M:%S %d/%m/%Y") if isinstance(l.created_at, datetime) else str(l.created_at)
                )
                for l in logs
            ]

            b_tot = float(wallet_info.get("budget_total", 0.0))
            b_rem = float(wallet_info.get("budget_remaining", 0.0))
            b_used = float(wallet_info.get("budget_used", 0.0))
            used_pct = float(wallet_info.get("used_percent", 0.0))
            est_images = int(b_rem // 75.0) if b_rem > 0 else 0
            is_active = (wallet_info.get("status") == "active")

            return ProviderBudgetOverview(
                provider_name=wallet_info.get("raw", {}).get("provider") or getattr(settings, "UPSTREAM_PROVIDER_NAME", "Chưa cấu hình"),
                key_masked=wallet_info.get("key_masked", "Chưa cấu hình"),
                status=wallet_info.get("status", "active"),
                status_text=wallet_info.get("status_text", "Bình thường"),
                is_active=is_active,
                budget_total=b_tot,
                budget_used=b_used,
                budget_remaining=b_rem,
                used_percent=used_pct,
                available_images_estimate=est_images,
                models_rates=wallet_info.get("models_rates"),
                last_synced_at=datetime.now().strftime("%H:%M:%S %d/%m/%Y"),
                recent_topups=recent_topups
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def topup_provider_budget(db: Session, amount: float, note: Optional[str], current_user: User) -> ProviderBudgetOverview:
        if amount <= 0:
            raise ValueError("Số tiền nạp ngân sách phải lớn hơn 0")

        from app.modules.generations.provider_client import provider_client
        current_tot = provider_client.get_configured_budget_total()
        new_tot = current_tot + float(amount)

        log = ProviderBudgetLog(
            id=f"pbl_{uuid.uuid4().hex[:12]}",
            provider_name=getattr(settings, "UPSTREAM_PROVIDER_NAME", "Chưa cấu hình"),
            key_masked=(provider_client.raw_api_key[:10] + "..." + provider_client.raw_api_key[-4:]) if provider_client.raw_api_key else "Chưa cấu hình",
            amount=float(amount),
            budget_before=current_tot,
            budget_after=new_tot,
            note=note or "Nạp ngân sách qua Web Admin",
            created_by=current_user.full_name or current_user.email,
            created_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()

        provider_client.custom_budget_total = new_tot
        return BillingService.get_provider_budget_overview(db)

    @staticmethod
    def sync_provider_budget(db: Session) -> ProviderBudgetOverview:
        from app.modules.generations.services import generation_service
        generation_service.get_provider_status(force_refresh=True)
        return BillingService.get_provider_budget_overview(db)

    @staticmethod
    def clear_provider_budget_logs(db: Session) -> ProviderBudgetOverview:
        db.query(ProviderBudgetLog).delete()
        db.commit()
        from app.modules.generations.provider_client import provider_client
        provider_client.custom_budget_total = 0.0
        return BillingService.get_provider_budget_overview(db)

    @staticmethod
    def delete_provider_budget_log(db: Session, log_id: str) -> ProviderBudgetOverview:
        log = db.query(ProviderBudgetLog).filter(ProviderBudgetLog.id == log_id).first()
        if log:
            db.delete(log)
            db.commit()
        from app.modules.generations.provider_client import provider_client
        latest = db.query(ProviderBudgetLog).order_by(ProviderBudgetLog.created_at.desc()).first()
        if latest and latest.budget_after and latest.budget_after > 0:
            provider_client.custom_budget_total = float(latest.budget_after)
        else:
            provider_client.custom_budget_total = 0.0
        return BillingService.get_provider_budget_overview(db)

billing_service = BillingService()


