from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class BaseResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Thành công"
    data: Optional[T] = None
    error: Optional[dict] = None

def success_response(data: Any = None, message: str = "Thành công") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
        "error": None
    }

def error_response(code: str, message: str, details: Any = None) -> dict:
    return {
        "success": False,
        "message": message,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details
        }
    }
