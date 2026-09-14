from fastapi import APIRouter
from app.core.responses import success_response
from app.modules.billing.services import billing_service

router = APIRouter(prefix="/billing", tags=["Billing & Wallet"])

@router.get("/wallet")
def get_wallet():
    wallet = billing_service.get_wallet()
    return success_response(wallet.model_dump(), "Lấy thông tin ví thành công")

@router.get("/transactions")
def get_transactions():
    transactions = billing_service.get_transactions()
    return success_response(transactions, "Lấy lịch sử giao dịch thành công")

@router.get("/banking")
def get_bank_accounts():
    accounts = billing_service.get_bank_accounts()
    return success_response([a.model_dump() for a in accounts], "Lấy danh sách tài khoản ngân hàng thành công")

@router.get("/sepay")
def get_sepay_transactions():
    transactions = billing_service.get_sepay_transactions()
    return success_response([t.model_dump() for t in transactions], "Lấy giao dịch SePay thành công")

@router.get("/credit-config")
def get_credit_config():
    config = billing_service.get_credit_config()
    return success_response(config.model_dump(), "Lấy cấu hình credit thành công")
