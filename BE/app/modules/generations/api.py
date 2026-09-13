from fastapi import APIRouter, Depends, Request, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.generations.schemas import ImageGenerationRequest
from app.modules.generations.services import generation_service

router = APIRouter(prefix="", tags=["Image Generation Gateway"])

def resolve_user_and_key(request: Request, db: Session):
    """
    Xác thực request qua Customer API Key hoặc JWT Token
    """
    auth_header = request.headers.get("Authorization", "")
    x_api_key = request.headers.get("x-api-key", "")
    token_str = ""

    if x_api_key:
        token_str = x_api_key
    elif auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]

    # 1. Thử xác thực với JWT Token
    if token_str:
        jwt_payload = decode_access_token(token_str)
        if jwt_payload and "sub" in jwt_payload:
            user = db.query(User).filter(User.email == jwt_payload["sub"]).first()
            if user:
                return user, None

    # 2. Thử xác thực với Customer API Key (id hoặc prefix)
    if token_str:
        # Check by id or prefix
        api_key = db.query(ApiKey).filter(
            (ApiKey.id == token_str) | 
            (ApiKey.key_prefix.like(f"{token_str[:8]}%"))
        ).first()
        if api_key:
            user = db.query(User).filter(User.id == api_key.user_id).first()
            if user:
                return user, api_key

    # 3. Fallback to default admin for convenience in demo mode
    default_user = db.query(User).first()
    return default_user, None

@router.post("/images/generations")
def generate_image(
    payload: ImageGenerationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [CỔNG API KHÁCH HÀNG] Tạo hình ảnh AI thế hệ mới (Model gpt-image-2)
    - Giá bán: 150 đ / ảnh
    - Giá vốn NCC: 120 đ / ảnh
    - Lợi nhuận gộp: 30 đ / ảnh
    """
    user, api_key = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Khóa API hoặc phiên đăng nhập không hợp lệ", status_code=401)

    result = generation_service.process_generation(
        db=db,
        request=payload,
        user=user,
        api_key=api_key
    )
    return success_response(result.model_dump(), "Tạo hình ảnh thành công", status_code=201)

@router.get("/generations/jobs")
def get_jobs(
    status: str = Query(default="ALL", description="Lọc theo trạng thái: ALL, SUCCEEDED, FAILED, PROCESSING"),
    search: str = Query(default="", description="Tìm kiếm theo từ khóa prompt"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Job logs và lịch sử tạo ảnh
    - Admin: Xem tất cả jobs
    - Khách hàng: Xem jobs của tài khoản mình
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để xem lịch sử jobs", status_code=401)

    offset = (page - 1) * page_size
    items, total = generation_service.get_job_logs(
        db=db,
        current_user=user,
        status=status if status != "ALL" else None,
        search=search if search else None,
        limit=page_size,
        offset=offset
    )

    return success_response(
        {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
        },
        "Lấy danh sách Jobs thành công"
    )

@router.get("/generations/financials")
def get_financial_summary(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [ADMIN] Thống kê dòng tiền, doanh thu bán ra 150đ, vốn NCC 120đ và lợi nhuận gộp
    """
    data = generation_service.get_financial_summary(db)
    return success_response(data.model_dump(), "Lấy báo cáo tài chính và dòng tiền thành công")

@router.get("/generations/provider-status")
def get_provider_status(request: Request):
    """
    Kiểm tra trạng thái kết nối tới Nhà Cung Cấp leeh.dev và số dư ví
    """
    data = generation_service.get_provider_status()
    return success_response(data.model_dump(), "Lấy trạng thái Nhà Cung Cấp thành công")

@router.post("/generations/provider-sync")
def sync_provider():
    """
    Đồng bộ lại số dư ví và trạng thái từ Nhà Cung Cấp leeh.dev
    """
    data = generation_service.get_provider_status()
    return success_response(data.model_dump(), "Đồng bộ thành công số dư từ Nhà Cung Cấp")
