from fastapi import APIRouter
from app.core.responses import success_response
from app.modules.api_keys.schemas import CreateApiKeyRequest
from app.modules.api_keys.services import api_key_service

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.get("")
def get_api_keys():
    keys = api_key_service.list_keys()
    return success_response(keys, "Lấy danh sách API Keys thành công")

@router.post("")
def create_api_key(payload: CreateApiKeyRequest):
    new_key = api_key_service.create_key(payload)
    return success_response(new_key.model_dump(), "Tạo API Key mới thành công")
