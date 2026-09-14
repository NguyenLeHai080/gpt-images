import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.core.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    balance = Column(Float, default=0.0, nullable=False)
    total_deposited = Column(Float, default=0.0, nullable=False)
    api_spent = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="VND", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    wallet_id = Column(String, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=True)
    amount = Column(Float, nullable=False)
    gateway = Column(String, default="SePay VietQR", nullable=False)
    status = Column(String, default="success", nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class SepayWebhookLog(Base):
    __tablename__ = "sepay_webhook_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sepay_id = Column(String, nullable=True)
    gateway = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    transfer_type = Column(String, nullable=True)
    transfer_amount = Column(Float, default=0.0, nullable=False)
    accumulated = Column(Float, default=0.0, nullable=False)
    content = Column(String, nullable=True)
    reference_code = Column(String, nullable=True)
    status = Column(String, default="PROCESSED", nullable=False)  # PROCESSED, IGNORED, ERROR
    matched_user_id = Column(String, nullable=True)
    raw_payload = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

