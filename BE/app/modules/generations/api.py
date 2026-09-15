import base64
import os
import uuid
import re
import time
from fastapi import APIRouter, Depends, Request, Query, HTTPException, UploadFile, File, Form
from fastapi.responses import Response, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.billing.models import Wallet
from app.modules.api_keys.models import ApiKey
from app.modules.api_keys.services import hash_api_token
from app.modules.generations.schemas import ImageGenerationRequest, UpdateJobRequest, BatchJobActionRequest, UpdateMaintenanceRequest
from app.modules.generations.services import generation_service

router = APIRouter(prefix="", tags=["Image Generation Gateway"])

def resolve_user_and_key(request: Request, db: Session):
    """
    Xác thực request qua Customer API Key hoặc JWT Token.
    Khách chỉ dùng API key được cấp (mf_live_sec_...) hoặc phiên đăng nhập.
    Tuyệt đối không fallback sang admin để ngăn chặn việc gọi API không khóa.
    """
    auth_header = request.headers.get("Authorization", "").strip()
    x_api_key = request.headers.get("x-api-key", "").strip()
    token_str = ""

    if x_api_key:
        token_str = x_api_key
    elif auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ", 1)[1].strip()

    if not token_str:
        return None, None

    # 1. Thử xác thực với JWT Token (Người dùng đăng nhập trên giao diện web)
    jwt_payload = decode_access_token(token_str)
    if jwt_payload and "sub" in jwt_payload:
        user = db.query(User).filter(User.email == jwt_payload["sub"]).first()
        if user and user.is_active:
            return user, None

    # 2. Thử xác thực với Customer API Key (băm SHA-256 hoặc ID khóa)
    token_hash = hash_api_token(token_str)
    api_key = db.query(ApiKey).filter(
        (ApiKey.hashed_key == token_hash) |
        (ApiKey.id == token_str)
    ).first()
    if api_key:
        status_clean = (api_key.status or "").upper()
        if status_clean != "ACTIVE":
            raise HTTPException(
                status_code=401,
                detail=f"API Key '{api_key.name}' ({api_key.key_prefix}) đã hết hạn hoặc bị tạm khóa (Trạng thái: {api_key.status}). Vui lòng tạo khóa mới hoặc kích hoạt lại tại Cổng Khách Hàng."
            )
        user = db.query(User).filter(User.id == api_key.user_id).first() if api_key.user_id else None
        if not user or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="Tài khoản liên kết với API Key này đã bị tạm khóa hoặc không tồn tại."
            )
        return user, api_key

    return None, None

@router.post("/images/generations")
@router.post("/v1/images/generations")
def generate_image(
    payload: ImageGenerationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [CỔNG API KHÁCH HÀNG] Tạo và chỉnh sửa hình ảnh AI thế hệ mới (OpenAI-compatible)
    - Models hỗ trợ: gpt-image-2.5-flare (mặc định), gpt-image-2.5-sunburst, gpt-image-2, nanobanana-2, gemini-3.1-flash-image-preview
    - Điểm ảnh thực: 1024x1024, 1792x1024, 1024x1792, 1024x768, 768x1024, 2048x2048
    - Giá niêm yết: 150 đ / ảnh thành công (Lỗi = 0 đ, hoàn tiền 100%)
    - Miễn phí 100% ảnh tham chiếu (Image-to-Image / Edits)
    """
    user, api_key = resolve_user_and_key(request, db)
    if not user:
        is_openai_sdk = (
            request.url.path.startswith("/v1/") or 
            "openai" in request.headers.get("user-agent", "").lower()
        )
        if is_openai_sdk:
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "message": "Incorrect API key provided. You must provide a valid API key (e.g. mf_live_sec_...) in the Authorization header.",
                        "type": "invalid_request_error",
                        "param": None,
                        "code": "invalid_api_key"
                    }
                }
            )
        return error_response("UNAUTHORIZED", "Khóa API không hợp lệ hoặc thiếu. Vui lòng cung cấp khóa API trong header Authorization hoặc x-api-key.", status_code=401)

    result = generation_service.process_generation(
        db=db,
        request=payload,
        user=user,
        api_key=api_key
    )

    # Đảm bảo đường dẫn ảnh tuyệt đối cho external API callers
    if result.image_url and result.image_url.startswith("/"):
        base = str(request.base_url).rstrip("/")
        if not ("127.0.0.1" in base or "localhost" in base):
            base = getattr(settings, "PUBLIC_API_URL", base).rstrip("/")
        full_image_url = f"{base}{result.image_url}"
        result.image_url = full_image_url
        if result.data and len(result.data) > 0:
            result.data[0]["url"] = full_image_url

    # Lấy số dư ví còn lại sau khi trừ tiền để gửi header cảnh báo
    user_wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    remaining_balance = user_wallet.balance if user_wallet else 0.0
    remaining_images = max(0, int(remaining_balance // 150))
    resp_headers = {
        "x-wallet-balance": f"{remaining_balance:,.0f} VND",
        "x-images-remaining": str(remaining_images),
    }
    if remaining_balance < 1000:
        resp_headers["x-warning"] = f"Low balance: only {remaining_images} images remaining ({remaining_balance:,.0f} VND). Please top up."

    # Hỗ trợ định dạng OpenAI SDK thuần túy khi client gọi qua /v1/ hoặc gửi OpenAI User-Agent
    is_openai_sdk = (
        request.url.path == "/v1/images/generations" or 
        "openai" in request.headers.get("user-agent", "").lower()
    ) and not ("localhost:517" in request.headers.get("referer", "") or "127.0.0.1:517" in request.headers.get("referer", ""))

    if is_openai_sdk:
        return JSONResponse(
            status_code=200,
            headers=resp_headers,
            content={
                "created": result.created or int(time.time()),
                "data": [
                    {
                        "url": result.image_url,
                        "revised_prompt": result.prompt
                    }
                ]
            }
        )

    return JSONResponse(
        status_code=201,
        headers=resp_headers,
        content={
            "success": True,
            "code": "SUCCESS",
            "message": "Tạo hình ảnh thành công",
            "data": result.model_dump(mode="json"),
            "meta": {
                "wallet_balance": remaining_balance,
                "images_remaining": remaining_images,
                "low_balance_warning": remaining_balance < 1000
            }
        }
    )

@router.post("/images/edits")
@router.post("/v1/images/edits")
async def edit_image(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [CHUẨN OPENAI EDITS] Chỉnh sửa hình ảnh theo ảnh mẫu (Image-to-Image)
    Tương thích với openai.images.edit() qua cả multipart/form-data và JSON payload.
    Hỗ trợ tự động tải file tham chiếu lên và xử lý qua Cụm AI Image Gateway.
    """
    user, api_key = resolve_user_and_key(request, db)
    if not user:
        is_openai_sdk = (
            request.url.path.startswith("/v1/") or 
            "openai" in request.headers.get("user-agent", "").lower()
        )
        if is_openai_sdk:
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "message": "Incorrect API key provided. You must provide a valid API key (e.g. mf_live_sec_...) in the Authorization header.",
                        "type": "invalid_request_error",
                        "param": None,
                        "code": "invalid_api_key"
                    }
                }
            )
        return error_response("UNAUTHORIZED", "Khóa API không hợp lệ hoặc thiếu. Vui lòng cung cấp khóa API trong header Authorization hoặc x-api-key.", status_code=401)

    content_type = request.headers.get("content-type", "").lower()
    prompt = ""
    model = "gpt-image-2.5-flare"
    size = "1024x1024"
    count = 1
    ref_image_path = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        prompt = str(form.get("prompt") or "").strip()
        model = str(form.get("model") or "gpt-image-2.5-flare").strip()
        size = str(form.get("size") or "1024x1024").strip()
        resolution = str(form.get("resolution") or "1k").strip()
        quality = str(form.get("quality") or "medium").strip()
        try:
            count = int(form.get("n", 1))
        except Exception:
            count = 1

        img_field = form.get("image")
        if img_field and hasattr(img_field, "read"):
            upload_dir = settings.REFERENCES_UPLOAD_DIR
            os.makedirs(upload_dir, exist_ok=True)
            fname = getattr(img_field, "filename", "edit_input.png") or "edit_input.png"
            ext = os.path.splitext(fname)[1].lower() or ".png"
            unique_name = f"edit_{uuid.uuid4().hex[:12]}{ext}"
            ref_image_path = os.path.join(upload_dir, unique_name)
            file_bytes = await img_field.read()
            with open(ref_image_path, "wb") as f_out:
                f_out.write(file_bytes)
        elif isinstance(img_field, str) and img_field.strip():
            ref_image_path = img_field.strip()
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        prompt = str(body.get("prompt") or "").strip()
        model = str(body.get("model") or "gpt-image-2.5-flare").strip()
        size = str(body.get("size") or body.get("aspect_ratio") or "1024x1024").strip()
        resolution = str(body.get("resolution") or "1k").strip()
        quality = str(body.get("quality") or "medium").strip()
        try:
            count = int(body.get("n") or body.get("count") or 1)
        except Exception:
            count = 1
        ref_image_path = body.get("image") or body.get("reference")

    if not prompt:
        return error_response("VALIDATION_ERROR", "Thiếu trường 'prompt' mô tả nội dung chỉnh sửa", status_code=422)

    gen_payload = ImageGenerationRequest(
        prompt=prompt,
        model=model,
        reference=ref_image_path,
        size=size,
        resolution=resolution,
        quality=quality,
        count=count,
        mode="edit"
    )

    result = generation_service.process_generation(
        db=db,
        request=gen_payload,
        user=user,
        api_key=api_key
    )

    if result.image_url and result.image_url.startswith("/"):
        base = str(request.base_url).rstrip("/")
        if not ("127.0.0.1" in base or "localhost" in base):
            base = getattr(settings, "PUBLIC_API_URL", base).rstrip("/")
        full_image_url = f"{base}{result.image_url}"
        result.image_url = full_image_url
        if result.data and len(result.data) > 0:
            result.data[0]["url"] = full_image_url

    is_openai_sdk = (
        request.url.path == "/v1/images/edits" or 
        "openai" in request.headers.get("user-agent", "").lower()
    ) and not ("localhost:517" in request.headers.get("referer", "") or "127.0.0.1:517" in request.headers.get("referer", ""))

    if is_openai_sdk:
        return JSONResponse(
            status_code=200,
            content={
                "created": result.created or int(time.time()),
                "data": [
                    {
                        "url": result.image_url,
                        "revised_prompt": result.prompt
                    }
                ]
            }
        )

    return success_response(result.model_dump(mode="json"), "Chỉnh sửa hình ảnh thành công", status_code=201)

@router.get("/models")
@router.get("/v1/models")
def list_models(request: Request):
    """
    [CHUẨN OPENAI] Liệt kê các mô hình AI sinh ảnh khả dụng
    Tương thích chuẩn openai.models.list() và các công cụ client AI
    """
    return {
        "object": "list",
        "data": [
            {
                "id": "gpt-image-2.5-flare",
                "object": "model",
                "created": 1710000000,
                "owned_by": "mintforge",
                "permission": [],
                "root": "gpt-image-2.5-flare",
                "parent": None
            },
            {
                "id": "gpt-image-2.5-sunburst",
                "object": "model",
                "created": 1710000000,
                "owned_by": "mintforge",
                "permission": [],
                "root": "gpt-image-2.5-sunburst",
                "parent": None
            },
            {
                "id": "gpt-image-2",
                "object": "model",
                "created": 1710000000,
                "owned_by": "mintforge",
                "permission": [],
                "root": "gpt-image-2",
                "parent": None
            },
            {
                "id": "nanobanana-2",
                "object": "model",
                "created": 1710000000,
                "owned_by": "mintforge",
                "permission": [],
                "root": "nanobanana-2",
                "parent": None
            },
            {
                "id": "gemini-3.1-flash-image-preview",
                "object": "model",
                "created": 1710000000,
                "owned_by": "mintforge",
                "permission": [],
                "root": "gemini-3.1-flash-image-preview",
                "parent": None
            },
            {
                "id": "dall-e-3",
                "object": "model",
                "created": 1710000000,
                "owned_by": "system-alias",
                "permission": [],
                "root": "gpt-image-2.5-flare",
                "parent": None
            },
            {
                "id": "dall-e-2",
                "object": "model",
                "created": 1710000000,
                "owned_by": "system-alias",
                "permission": [],
                "root": "gpt-image-2",
                "parent": None
            }
        ]
    }

@router.get("/models/{model_id}")
@router.get("/v1/models/{model_id}")
def retrieve_model(model_id: str):
    """[CHUẨN OPENAI] Tra cứu chi tiết một mô hình"""
    return {
        "id": model_id,
        "object": "model",
        "created": 1710000000,
        "owned_by": "mintforge",
        "permission": [],
        "root": model_id,
        "parent": None
    }

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
    - Khách hàng: Xem jobs của tài khoản mình kèm thống kê tổng số jobs đã tạo
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để xem lịch sử jobs", status_code=401)

    offset = (page - 1) * page_size
    items, total, user_stats = generation_service.get_job_logs(
        db=db,
        current_user=user,
        status=status if status != "ALL" else None,
        search=search if search else None,
        limit=page_size,
        offset=offset
    )

    return success_response(
        {
            "items": [item.model_dump(mode="json") for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
            "stats": user_stats
        },
        "Lấy danh sách Jobs thành công"
    )

@router.get("/generations/financials")
def get_financial_summary(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [ADMIN] Thống kê dòng tiền, doanh thu bán ra 150đ, vốn NCC 75đ và lợi nhuận gộp 75đ (50%)
    """
    user, _ = resolve_user_and_key(request, db)
    if not user or user.role not in ["SUPER_ADMIN", "ADMIN"]:
        return error_response("FORBIDDEN", "Chỉ quản trị viên mới có quyền xem dòng tiền và lợi nhuận", status_code=403)
    data = generation_service.get_financial_summary(db)
    return success_response(data.model_dump(mode="json"), "Lấy báo cáo tài chính và dòng tiền thành công")

@router.get("/generations/provider-status")
def get_provider_status(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Kiểm tra trạng thái kết nối tới hệ thống AI Cluster Engine và số dư quota (Chỉ Admin)
    """
    user, _ = resolve_user_and_key(request, db)
    if not user or user.role not in ["SUPER_ADMIN", "ADMIN"]:
        return error_response("FORBIDDEN", "Chỉ quản trị viên mới có quyền xem trạng thái nhà cung cấp", status_code=403)
    data = generation_service.get_provider_status()
    return success_response(data.model_dump(mode="json"), "Lấy trạng thái AI Cluster Engine thành công")

@router.post("/generations/provider-sync")
def sync_provider(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Đồng bộ lại số dư quota và trạng thái từ hệ thống AI Cluster Engine (Chỉ Admin)
    """
    user, _ = resolve_user_and_key(request, db)
    if not user or user.role not in ["SUPER_ADMIN", "ADMIN"]:
        return error_response("FORBIDDEN", "Chỉ quản trị viên mới có quyền đồng bộ nhà cung cấp", status_code=403)
    data = generation_service.get_provider_status(force_refresh=True)
    return success_response(data.model_dump(mode="json"), "Đồng bộ thành công số dư từ AI Cluster Engine")

@router.get("/system/maintenance")
def get_system_maintenance(db: Session = Depends(get_db)):
    """
    [PUBLIC] Lấy trạng thái chế độ bảo trì API (Dành cho Web và API client kiểm tra)
    """
    from app.modules.dashboard.services import dashboard_service
    res = dashboard_service.get_maintenance_mode(db)
    return success_response(res, "Lấy trạng thái bảo trì thành công")

@router.post("/system/maintenance")
def set_system_maintenance(
    payload: UpdateMaintenanceRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    [SUPER ADMIN / ADMIN] Bật / Tắt chế độ bảo trì toàn hệ thống
    """
    user, _ = resolve_user_and_key(request, db)
    if not user or user.role not in ["SUPER_ADMIN", "ADMIN"]:
        return error_response("FORBIDDEN", "Chỉ quản trị viên mới có quyền thay đổi trạng thái bảo trì hệ thống", status_code=403)
    
    from app.modules.dashboard.services import dashboard_service
    res = dashboard_service.set_maintenance_mode(db, enabled=payload.is_maintenance, message=payload.message, user=user)
    action_text = "BẬT" if payload.is_maintenance else "TẮT"
    return success_response(res, f"Đã {action_text} chế độ bảo trì API toàn hệ thống thành công!")


UPLOAD_DIR = settings.REFERENCES_UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

@router.post("/generations/upload")
@router.post("/v1/images/upload")
async def upload_reference_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    [TẢI ẢNH TỪ MÁY TÍNH] Tải ảnh tham chiếu từ máy tính lên server để làm ảnh mẫu Image-to-Image
    - Hỗ trợ PNG, JPG, JPEG, WEBP
    - Tối đa 15MB
    - Trả về URL nội bộ và Data URI Base64
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để tải ảnh lên", status_code=401)

    filename = file.filename or "upload.png"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return error_response("INVALID_FILE_TYPE", f"Định dạng tệp không được hỗ trợ ({ext}). Vui lòng chọn PNG, JPG, JPEG hoặc WEBP", status_code=400)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        return error_response("FILE_TOO_LARGE", "Dung lượng ảnh vượt quá 15MB", status_code=400)

    # Lưu file với tên an toàn
    clean_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    unique_name = f"{uuid.uuid4().hex[:12]}_{clean_name}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    relative_url = f"/static/uploads/references/{unique_name}"
    base_url = str(request.base_url).rstrip("/")
    full_url = f"{base_url}{relative_url}"
    
    # Tạo Data URI base64
    content_type = file.content_type or f"image/{ext.lstrip('.')}"
    b64_str = base64.b64encode(contents).decode("utf-8")
    data_uri = f"data:{content_type};base64,{b64_str}"

    return success_response({
        "url": full_url,
        "relative_url": relative_url,
        "base64": data_uri,
        "filename": filename,
        "size": len(contents),
        "content_type": content_type
    }, "Tải ảnh từ máy tính lên thành công!")

@router.delete("/generations/jobs/{job_id}")
def delete_job(
    job_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Xóa bản ghi job theo ID
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện", status_code=401)
    
    ok = generation_service.delete_job(db, job_id, user)
    if not ok:
        return error_response("NOT_FOUND", "Không tìm thấy job hoặc bạn không có quyền xóa", status_code=404)
    return success_response({"id": job_id}, "Xóa job thành công")

@router.patch("/generations/jobs/{job_id}")
def update_job(
    job_id: str,
    payload: UpdateJobRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Chỉnh sửa thông tin prompt của job
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện", status_code=401)

    updated = generation_service.update_job(db, job_id, payload.prompt, user)
    if not updated:
        return error_response("NOT_FOUND", "Không tìm thấy job hoặc bạn không có quyền sửa", status_code=404)
    return success_response(updated.model_dump(mode="json"), "Cập nhật job thành công")

@router.get("/generations/jobs/{job_id}/image")
def get_job_image(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Phục vụ trực tiếp ảnh nhị phân PNG với header Cache-Control 24h
    Tối ưu hóa triệt để, loại bỏ toàn bộ chuỗi base64 nặng hàng chục MB khỏi JSON response
    """
    from app.modules.generations.models import ImageGenerationJob
    job = db.query(ImageGenerationJob).filter(ImageGenerationJob.id == job_id).first()
    if not job or not job.image_url:
        raise HTTPException(status_code=404, detail="Không tìm thấy hình ảnh cho job này")

    img_url = job.image_url.strip()

    # Nếu là file cục bộ (/static/uploads/...)
    if img_url.startswith("/static/uploads/") or img_url.startswith("static/uploads/"):
        rel_path = img_url.lstrip("/")
        full_path = os.path.join(settings.UPLOAD_DIR, rel_path.replace("static/uploads/", ""))
        if not os.path.exists(full_path):
            full_path = os.path.join(settings.BASE_DIR, rel_path)
        if os.path.exists(full_path):
            with open(full_path, "rb") as f:
                data = f.read()
            ext = os.path.splitext(full_path)[1].lower()
            content_type = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
            return Response(
                content=data,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400, immutable",
                    "Content-Disposition": f'inline; filename="job-{job_id}{ext}"'
                }
            )

    # Nếu là URL ngoại vi: tải server-side và stream nhị phân, tuyệt đối KHÔNG redirect 302
    if img_url.startswith("http://") or img_url.startswith("https://"):
        try:
            import urllib.request
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=20) as uresp:
                data = uresp.read()
                content_type = uresp.headers.get_content_type() or "image/png"
                # Cache lại cục bộ trên server để lần sau không cần tải lại
                try:
                    gen_dir = os.path.join(settings.UPLOAD_DIR, "generated")
                    os.makedirs(gen_dir, exist_ok=True)
                    ext = ".png" if "png" in content_type else (".webp" if "webp" in content_type else ".jpg")
                    saved_path = os.path.join(gen_dir, f"{job_id}{ext}")
                    with open(saved_path, "wb") as f_out:
                        f_out.write(data)
                    job.image_url = f"/static/uploads/generated/{job_id}{ext}"
                    db.commit()
                except Exception:
                    pass
                return Response(
                    content=data,
                    media_type=content_type,
                    headers={
                        "Cache-Control": "public, max-age=86400, immutable",
                        "Content-Disposition": f'inline; filename="job-{job_id}.png"'
                    }
                )
        except Exception:
            raise HTTPException(status_code=502, detail="Không thể tải dữ liệu hình ảnh. Vui lòng thử lại sau.")

    # Nếu là chuỗi data URI: data:image/...;base64,...
    if img_url.startswith("data:image/"):
        try:
            header, b64data = img_url.split(",", 1)
            media_type = header.split(";")[0].replace("data:", "") or "image/png"
            image_bytes = base64.b64decode(b64data)
            return Response(
                content=image_bytes,
                media_type=media_type,
                headers={
                    "Cache-Control": "public, max-age=86400, immutable",
                    "Content-Disposition": f'inline; filename="job-{job_id}.png"'
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi giải mã ảnh: {str(e)}")

    raise HTTPException(status_code=404, detail="Định dạng ảnh không hợp lệ")

@router.post("/generations/jobs/batch-delete")
def batch_delete_jobs(
    payload: BatchJobActionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Xóa hàng loạt bản ghi jobs theo danh sách ID
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện", status_code=401)

    count = generation_service.batch_delete_jobs(db, payload.job_ids, user)
    return success_response({"deleted_count": count}, f"Đã xóa thành công {count} jobs")

@router.post("/generations/jobs/batch-cancel")
def batch_cancel_jobs(
    payload: BatchJobActionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Hủy hàng loạt các jobs theo danh sách ID
    """
    user, _ = resolve_user_and_key(request, db)
    if not user:
        return error_response("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện", status_code=401)

    count = generation_service.batch_cancel_jobs(db, payload.job_ids, user)
    return success_response({"cancelled_count": count}, f"Đã hủy thành công {count} jobs")



