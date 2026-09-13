import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from app.core.database import Base

class ApiActivityLog(Base):
    __tablename__ = "api_activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_name = Column(String, default="Nguyen Le Hai", nullable=False)
    model_name = Column(String, default="gpt-image-2", nullable=False)
    status = Column(String, default="success", nullable=False)
    cost = Column(Float, default=120.0, nullable=False)
    cost_display = Column(String, default="120 đ", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
