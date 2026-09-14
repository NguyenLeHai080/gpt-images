from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.responses import success_response
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.billing.schemas import SepayWebhookPayload
from app.modules.billing.services import billing_service

router = APIRouter(prefix="/billing", tags=["Billing & Wallet"])

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

@router.get("/wallet")
def get_wallet(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    user_id = user.id if user else None
    wallet = billing_service.get_wallet(user_id=user_id, db=db)
    return success_response(wallet.model_dump(), "Lấy thông tin ví thành công")

@router.get("/transactions")
def get_transactions(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    user_id = user.id if user else None
    is_admin = user.role in ("SUPER_ADMIN", "ADMIN") if user else True
    transactions = billing_service.get_transactions(user_id=user_id, is_admin=is_admin, db=db)
    return success_response(transactions, "Lấy lịch sử giao dịch thành công")

@router.get("/banking")
def get_bank_accounts(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    user_id = user.id if user else "user_admin_01"
    accounts = billing_service.get_bank_accounts(user_id=user_id)
    return success_response([a.model_dump() for a in accounts], "Lấy danh sách tài khoản ngân hàng thành công")


@router.get("/sepay")
def get_sepay_transactions(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    if not user or user.role not in ("SUPER_ADMIN", "ADMIN"):
        raise HTTPException(status_code=403, detail="Chỉ Quản trị viên mới có quyền truy cập nhật ký nạp tiền SePay.")
    transactions = billing_service.get_sepay_transactions(db=db)
    return success_response([t.model_dump() for t in transactions], "Lấy giao dịch SePay thành công")

@router.delete("/sepay")
def clear_sepay_transactions(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_request(request, db)
    if not user or user.role not in ("SUPER_ADMIN", "ADMIN"):
        raise HTTPException(status_code=403, detail="Chỉ Quản trị viên mới có quyền xoá nhật ký nạp tiền SePay.")
    deleted_count = billing_service.clear_sepay_transactions(db=db)
    return success_response({"deleted_count": deleted_count}, f"Đã xoá {deleted_count} bản ghi lịch sử nạp tiền SePay.")

@router.get("/credit-config")
def get_credit_config():
    config = billing_service.get_credit_config()
    return success_response(config.model_dump(), "Lấy cấu hình credit thành công")

@router.post("/webhook/sepay")
def receive_sepay_webhook(payload: SepayWebhookPayload):
    """
    Endpoint tiếp nhận Webhook giao dịch nạp tiền từ cổng SePay.
    Tự động lọc theo cú pháp tiền tố 'GPT <USER_ID>'.
    Nếu là giao dịch của web khác (Meridians) hoặc cá nhân, trả về 200 OK và bỏ qua an toàn.
    """
    return billing_service.process_sepay_webhook(payload)

@router.post("/webhook")
def receive_sepay_webhook_alias(payload: SepayWebhookPayload):
    """
    Alias endpoint cho SePay Webhook
    """
    return billing_service.process_sepay_webhook(payload)

