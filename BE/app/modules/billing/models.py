import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.core.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    balance = Column(Float, default=24702.0, nullable=False)
    total_deposited = Column(Float, default=4331500.0, nullable=False)
    api_spent = Column(Float, default=480.0, nullable=False)
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
