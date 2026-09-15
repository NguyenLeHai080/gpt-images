from typing import Optional
from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.dashboard.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_current_user_from_request(request: Request, db: Session) -> User:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.email == payload["sub"]).first()
            if user:
                return user
    return db.query(User).first()

@router.get("/overview")
def get_dashboard_overview(
    request: Request,
    user_id: Optional[str] = Query(None, description="Lọc theo user_id (dành cho Admin)"),
    db: Session = Depends(get_db)
):
    current_user = get_current_user_from_request(request, db)
    target_id = current_user.id if (current_user and current_user.role == "MEMBER") else user_id
    data = dashboard_service.get_overview(user=current_user, target_user_id=target_id, db=db)
    return success_response(data.model_dump(), "Lấy dữ liệu tổng quan thành công")

@router.get("/metrics")
def get_metrics(
    request: Request,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user_from_request(request, db)
    data = dashboard_service.get_overview(user=current_user, target_user_id=user_id, db=db)
    return success_response(data.metrics, "Lấy danh sách chỉ số thành công")

@router.get("/charts")
def get_charts(
    request: Request,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user_from_request(request, db)
    data = dashboard_service.get_overview(user=current_user, target_user_id=user_id, db=db)
    return success_response(data.chart_data, "Lấy dữ liệu biểu đồ thành công")

@router.get("/activities")
def get_activities(
    request: Request,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user_from_request(request, db)
    data = dashboard_service.get_overview(user=current_user, target_user_id=user_id, db=db)
    return success_response(data.recent_activities, "Lấy nhật ký hoạt động thành công")
