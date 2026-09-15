import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from app.core.database import Base

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(String(64), primary_key=True, default=lambda: f"prov_{uuid.uuid4().hex[:12]}")
    name = Column(String(100), nullable=False)
    provider_code = Column(String(64), unique=True, index=True, nullable=False)
    base_url = Column(String(255), nullable=False)
    api_key = Column(String(255), nullable=False)
    default_model = Column(String(64), default="gpt-image-2.5-flare", nullable=False)
    models_supported = Column(Text, default="[]", nullable=False)  # JSON array string
    cost_per_image = Column(Float, default=75.0, nullable=False)
    is_primary = Column(Boolean, default=False, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="ONLINE", nullable=False)  # ONLINE, STANDBY, OFFLINE, ERROR
    latency_ms = Column(Integer, default=35, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
