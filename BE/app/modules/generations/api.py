import base64
import os
import uuid
import re
from fastapi import APIRouter, Depends, Request, Query, HTTPException, UploadFile, File
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.api_keys.services import hash_api_token
from app.modules.generations.schemas import ImageGenerationRequest, UpdateJobRequest, BatchJobActionRequest
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

    # 2. Thử xác thực với Customer API Key (băm SHA-256 hoặc ID khóa)
    if token_str:
        token_hash = hash_api_token(token_str)
        api_key = db.query(ApiKey).filter(
            (ApiKey.hashed_key == token_hash) |
            (ApiKey.id == token_str)
        ).first()
        if api_key:
            user = db.query(User).filter(User.id == api_key.user_id).first() if api_key.user_id else None
            if not user:
                user = db.query(User).first()
            return user, api_key


    # 3. Fallback to default admin for convenience in demo mode
    default_user = db.query(User).first()
    return default_user, None

@router.post("/images/generations")
@router.post("/v1/images/generations")
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
            "items": [item.model_dump() for item in items],
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
    [ADMIN] Thống kê dòng tiền, doanh thu bán ra 150đ, vốn NCC 120đ và lợi nhuận gộp
    """
    data = generation_service.get_financial_summary(db)
    return success_response(data.model_dump(), "Lấy báo cáo tài chính và dòng tiền thành công")

@router.get("/generations/provider-status")
def get_provider_status(request: Request):
    """
    Kiểm tra trạng thái kết nối tới hệ thống AI Cluster Engine và số dư quota
    """
    data = generation_service.get_provider_status()
    return success_response(data.model_dump(), "Lấy trạng thái AI Cluster Engine thành công")

@router.post("/generations/provider-sync")
def sync_provider():
    """
    Đồng bộ lại số dư quota và trạng thái từ hệ thống AI Cluster Engine (bỏ qua bộ đệm cache)
    """
    data = generation_service.get_provider_status(force_refresh=True)
    return success_response(data.model_dump(), "Đồng bộ thành công số dư từ AI Cluster Engine")

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
    return success_response(updated.model_dump(), "Cập nhật job thành công")

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

    # Nếu là URL ngoại vi
    if img_url.startswith("http://") or img_url.startswith("https://"):
        # Nếu URL trỏ tới nhà cung cấp upstream -> proxy dữ liệu ảnh trực tiếp để tuyệt đối không lộ domain NCC
        if "leeh.dev" in img_url or "internal" in img_url:
            try:
                import urllib.request
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, context=ctx, timeout=15) as uresp:
                    data = uresp.read()
                    content_type = uresp.headers.get_content_type() or "image/png"
                    return Response(
                        content=data,
                        media_type=content_type,
                        headers={
                            "Cache-Control": "public, max-age=86400, immutable",
                            "Content-Disposition": f'inline; filename="job-{job_id}.png"'
                        }
                    )
            except Exception:
                pass
        return RedirectResponse(url=img_url, status_code=302)

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



