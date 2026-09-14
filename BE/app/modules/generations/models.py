import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ImageGenerationJob(Base):
    __tablename__ = "image_generation_jobs"

    id = Column(String(64), primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:16]}")
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    api_key_id = Column(String(64), ForeignKey("api_keys.id"), nullable=True, index=True)
    
    # Request details
    prompt = Column(Text, nullable=False)
    model = Column(String(64), default="gpt-image-2", nullable=False)
    aspect_ratio = Column(String(32), default="1024x1024", nullable=False)
    resolution = Column(String(32), default="1k", nullable=True)
    quality = Column(String(32), default="high", nullable=True)
    reference = Column(Text, nullable=True)
    references = Column(Text, nullable=True)
    count = Column(Integer, default=1, nullable=False)
    execution_mode = Column(String(32), default="sync", nullable=False)
    
    # Provider mapping
    provider_task_id = Column(String(128), nullable=True)
    provider_generation_id = Column(String(128), nullable=True)
    image_url = Column(Text, nullable=True)
    
    # Status & Error Logging
    status = Column(String(32), default="PENDING", index=True)  # PENDING, PROCESSING, SUCCEEDED, FAILED
    is_cached = Column(Boolean, default=False, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    error_code = Column(String(64), nullable=True)
    raw_response = Column(Text, nullable=True)
    latency_ms = Column(Integer, default=0)
    
    # Financials (VND)
    cost_provider = Column(Float, default=120.0)    # Chi phí trả NCC: 120đ (0đ nếu Cache Hit)
    charged_customer = Column(Float, default=150.0) # Thu từ khách: 150đ
    profit = Column(Float, default=30.0)            # Lợi nhuận gộp: 30đ (+150đ nếu Cache Hit)
    
    created_at = Column(DateTime, default=datetime.now, index=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", backref="generation_jobs")
    api_key = relationship("ApiKey", backref="generation_jobs")

class ImageGenerationCache(Base):
    __tablename__ = "image_generation_caches"

    id = Column(String(64), primary_key=True)  # SHA-256 cache key
    prompt = Column(Text, nullable=False)
    model = Column(String(64), default="gpt-image-2", nullable=False)
    aspect_ratio = Column(String(32), default="1024x1024", nullable=False)
    resolution = Column(String(32), default="1k", nullable=False)
    quality = Column(String(32), default="high", nullable=True)
    references_json = Column(Text, nullable=True)
    image_url = Column(Text, nullable=False)
    provider_task_id = Column(String(128), nullable=True)
    hit_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    last_accessed_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class ProviderAccount(Base):
    __tablename__ = "provider_accounts"

    id = Column(String(64), primary_key=True, default="provider_default")
    provider_name = Column(String(100), default="Nexora AI Cluster Engine")
    base_url = Column(String(255), default="https://cluster.internal")
    username = Column(String(100), default="cluster-worker-01")

    password = Column(String(100), default="123123123")
    access_token = Column(Text, nullable=True)
    api_key = Column(String(255), nullable=True)
    wallet_balance = Column(Float, default=24702.0)
    currency = Column(String(10), default="VND")
    is_active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
