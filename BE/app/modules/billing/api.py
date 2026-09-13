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
