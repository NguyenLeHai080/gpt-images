from fastapi import APIRouter
from app.core.responses import success_response
from app.modules.dashboard.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
def get_dashboard_overview():
    data = dashboard_service.get_overview()
    return success_response(data.model_dump(), "Lấy dữ liệu tổng quan thành công")

@router.get("/metrics")
def get_metrics():
    data = dashboard_service.get_overview()
    return success_response(data.metrics, "Lấy danh sách chỉ số thành công")

@router.get("/charts")
def get_charts():
    data = dashboard_service.get_overview()
    return success_response(data.chart_data, "Lấy dữ liệu biểu đồ thành công")

@router.get("/activities")
def get_activities():
    data = dashboard_service.get_overview()
    return success_response(data.recent_activities, "Lấy nhật ký hoạt động thành công")
