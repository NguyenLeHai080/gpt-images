from datetime import datetime
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.billing.models import Wallet, Transaction
from app.modules.dashboard.models import ApiActivityLog

def init_database() -> None:
    """
    Khởi tạo toàn bộ bảng trong PostgreSQL và seed dữ liệu mẫu ban đầu
    """
    print("[PostgreSQL] Synchronizing tables with Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Super Admin User
        admin_user = db.query(User).filter(User.email == "admin@mintforge.vn").first()
        if not admin_user:
            admin_user = User(
                id="user_admin_01",
                email="admin@mintforge.vn",
                hashed_password=get_password_hash("admin123"),
                full_name="Nguyen Le Hai",
                role="SUPER_ADMIN",
                company_name="MintForge Business Suite",
                avatar_url=None,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("[PostgreSQL] Seeded super admin: admin@mintforge.vn")

        # 2. Seed 28 API Keys
        total_keys = db.query(ApiKey).count()
        if total_keys == 0:
            for i in range(1, 29):
                key_prefix = f"mf_live_sec_{i:02d}..."
                api_key = ApiKey(
                    id=f"key_{i:02d}",
                    user_id=admin_user.id,
                    name=f"Production AI Key #{i:02d}" if i <= 10 else f"Worker Key #{i:02d}",
                    key_prefix=key_prefix,
                    hashed_key=get_password_hash(f"secret_key_value_{i}"),
                    rate_limit="120 req/min" if i <= 5 else "60 req/min",
                    status="active",
                    last_used_at="Vừa xong" if i <= 3 else f"{i * 2} phút trước",
                )
                db.add(api_key)
            db.commit()
            print("[PostgreSQL] Seeded 28 API Keys successfully.")

        # 3. Seed Wallet & Transactions
        wallet = db.query(Wallet).filter(Wallet.user_id == admin_user.id).first()
        if not wallet:
            wallet = Wallet(
                id="wallet_admin_01",
                user_id=admin_user.id,
                balance=24702.0,
                total_deposited=4331500.0,
                api_spent=480.0,
                currency="VND",
            )
            db.add(wallet)
            db.commit()

            txs = [
                Transaction(
                    id="TX-89214",
                    wallet_id=wallet.id,
                    amount=2000000.0,
                    gateway="SePay VietQR",
                    status="success",
                    description="Nạp số dư tài khoản API gói Doanh nghiệp",
                    created_at=datetime(2026, 9, 12, 14, 15),
                ),
                Transaction(
                    id="TX-89190",
                    wallet_id=wallet.id,
                    amount=1500000.0,
                    gateway="VietinBank QR",
                    status="success",
                    description="Thanh toán nạp tiền tự động",
                    created_at=datetime(2026, 9, 10, 9, 30),
                ),
                Transaction(
                    id="TX-88942",
                    wallet_id=wallet.id,
                    amount=831500.0,
                    gateway="SePay Auto",
                    status="success",
                    description="Nạp tín dụng xử lý model gpt-image-2",
                    created_at=datetime(2026, 9, 8, 16, 45),
                ),
            ]
            db.add_all(txs)
            db.commit()
            print("[PostgreSQL] Seeded enterprise wallet and transactions.")

        # 4. Seed Recent Activity Logs
        act_count = db.query(ApiActivityLog).count()
        if act_count == 0:
            acts = [
                ApiActivityLog(
                    id="act_1",
                    user_name="Nguyen Le Hai",
                    model_name="gpt-image-2",
                    status="success",
                    cost=120.0,
                    cost_display="120 đ",
                    created_at=datetime(2026, 9, 12, 14, 19, 9),
                ),
                ApiActivityLog(
                    id="act_2",
                    user_name="Nguyen Le Hai",
                    model_name="gpt-image-2",
                    status="success",
                    cost=120.0,
                    cost_display="120 đ",
                    created_at=datetime(2026, 9, 12, 14, 18, 22),
                ),
                ApiActivityLog(
                    id="act_3",
                    user_name="Nguyen Le Hai",
                    model_name="gpt-image-2",
                    status="success",
                    cost=120.0,
                    cost_display="120 đ",
                    created_at=datetime(2026, 9, 12, 14, 15, 10),
                ),
                ApiActivityLog(
                    id="act_4",
                    user_name="Nguyen Le Hai",
                    model_name="gpt-image-2",
                    status="success",
                    cost=120.0,
                    cost_display="120 đ",
                    created_at=datetime(2026, 9, 12, 14, 10, 5),
                ),
            ]
            db.add_all(acts)
            db.commit()
            print("[PostgreSQL] Seeded recent API activity logs.")

    except Exception as e:
        db.rollback()
        print(f"[PostgreSQL Error] Seed failed: {e}")
    finally:
        db.close()
