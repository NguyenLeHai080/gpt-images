from fastapi import APIRouter, Depends
from app.core.responses import success_response
from app.core.dependencies import require_roles
from app.modules.tools.schemas import UpdateGatewayConfigRequest
from app.modules.tools.services import tools_service

router = APIRouter(prefix="/tools", tags=["AI Gateway & System Tools"])

@router.get("/config")
def get_gateway_config():
    """Lấy thông số cấu hình AI Gateway & Smart Cache"""
    cfg = tools_service.get_config()
    return success_response(cfg.model_dump(), "Lấy cấu hình hệ thống thành công")

@router.put("/config", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def update_gateway_config(payload: UpdateGatewayConfigRequest):
    """Cập nhật thông số vận hành AI Gateway"""
    cfg = tools_service.update_config(payload)
    return success_response(cfg.model_dump(), "Cập nhật cấu hình thành công")

@router.post("/cache/flush", dependencies=[Depends(require_roles(["SUPER_ADMIN", "ADMIN"]))])
def flush_cache():
    """Xóa toàn bộ Smart Cache trên bộ nhớ đệm máy chủ"""
    res = tools_service.flush_cache()
    return success_response(res, "Đã làm trống toàn bộ Smart Cache")
