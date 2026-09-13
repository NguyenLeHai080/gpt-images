import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.core.database import Base

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    key_prefix = Column(String, unique=True, index=True, nullable=False)
    hashed_key = Column(String, nullable=False)
    rate_limit = Column(String, default="60 req/min", nullable=False)
    status = Column(String, default="active", nullable=False)
    last_used_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
