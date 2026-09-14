from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from app.core.database import Base

class ModelPricing(Base):
    __tablename__ = "model_pricings"

    model = Column(String(64), primary_key=True)  # e.g., 'gpt-image-2'
    display_name = Column(String(128), nullable=False)
    provider = Column(String(128), default="Nexora AI Core", nullable=False)

    
    # Financial fields (VND)
    provider_cost = Column(Float, default=120.0, nullable=False)   # Chi phí gốc trả cho NCC
    base_price = Column(Float, default=150.0, nullable=False)      # Giá bán API thu từ khách
    token_rate = Column(Integer, default=1024, nullable=False)     # Số token tương đương / lượt sinh
    currency = Column(String(16), default="VND", nullable=False)
    unit = Column(String(32), default="ảnh", nullable=False)
    
    # Operational fields
    status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, MAINTENANCE
    latency_range = Column(String(64), default="25ms (Cache) - 3.2s (Gen)")
    smart_cache_support = Column(Boolean, default=True, nullable=False)
    cache_cost = Column(Float, default=0.0, nullable=False)
    
    # Multipliers & descriptions stored as JSON text
    resolutions_json = Column(Text, nullable=True)
    qualities_json = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
