from datetime import datetime
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.billing.models import Wallet, Transaction
from app.modules.dashboard.models import ApiActivityLog
from app.modules.generations.models import ImageGenerationJob, ProviderAccount
from app.modules.pricing.models import ModelPricing
from app.modules.pricing.services import pricing_service
from app.modules.providers.models import AIProvider
from app.modules.providers.services import providers_service

def init_database() -> None:
    """
    Khởi tạo toàn bộ bảng trong PostgreSQL và seed dữ liệu mẫu ban đầu
    """
    print("[PostgreSQL] Synchronizing tables with Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Users (Super Admin, Admin, Developer, Members)
        seed_users = [
            {
                "id": "user_admin_01",
                "email": "admin@mintforge.vn",
                "password": "admin123",
                "full_name": "Nguyen Le Hai",
                "role": "SUPER_ADMIN",
                "company_name": "MintForge Business Suite",
                "is_active": True,
            },
            {
                "id": "user_admin_02",
                "email": "techlead@mintforge.vn",
                "password": "techlead123",
                "full_name": "Tran Minh Duc",
                "role": "ADMIN",
                "company_name": "MintForge AI Lab",
                "is_active": True,
            },
            {
                "id": "user_dev_01",
                "email": "ai.dev@mintforge.vn",
                "password": "aidev123",
                "full_name": "Le Hoang Nam",
                "role": "DEVELOPER",
                "company_name": "MintForge Engineering",
                "is_active": True,
            },
            {
                "id": "user_member_01",
                "email": "accountant@mintforge.vn",
                "password": "member123",
                "full_name": "Nguyen Thu Ha",
                "role": "MEMBER",
                "company_name": "MintForge Finance",
                "is_active": True,
            },
            {
                "id": "user_member_02",
                "email": "viewer@mintforge.vn",
                "password": "viewer123",
                "full_name": "Pham Quoc Bao",
                "role": "MEMBER",
                "company_name": "External Partner Ltd",
                "is_active": False,
            },
        ]

        admin_user = None
        for u in seed_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_u = User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    company_name=u["company_name"],
                    avatar_url=None,
                    is_active=u["is_active"],
                )
                db.add(new_u)
                if u["role"] == "SUPER_ADMIN":
                    admin_user = new_u
            elif u["role"] == "SUPER_ADMIN":
                admin_user = existing
        db.commit()
        if not admin_user:
            admin_user = db.query(User).first()
        print("[PostgreSQL] Seeded system users with multiple roles.")

        # 2. Seed Clean Master API Key if none exists
        total_keys = db.query(ApiKey).count()
        if total_keys == 0 and admin_user:
            api_key = ApiKey(
                id="key_master_admin",
                user_id=admin_user.id,
                name="API Key Chính (Production Cổng Khách)",
                key_prefix="mf_live_sec_master...",
                hashed_key=get_password_hash("secret_key_master_admin"),
                rate_limit="120 req/min",
                status="active",
                last_used_at="Vừa xong",
            )
            db.add(api_key)
            db.commit()
            print("[PostgreSQL] Seeded clean Master API Key.")

        # 3. Seed Wallets for Users
        for u in db.query(User).all():
            w = db.query(Wallet).filter(Wallet.user_id == u.id).first()
            if not w:
                w = Wallet(
                    id=f"wallet_{u.id}",
                    user_id=u.id,
                    balance=0.0,
                    total_deposited=0.0,
                    api_spent=0.0,
                    currency="VND",
                )
                db.add(w)
        db.commit()
        print("[PostgreSQL] Initialized clean user wallets with 0 VND.")

        # 5. Seed Provider Config
        provider_acc = db.query(ProviderAccount).filter(ProviderAccount.id == "provider_default").first()
        if not provider_acc:
            provider_acc = ProviderAccount(
                id="provider_default",
                provider_name="Xompet AI Gateway",
                base_url="https://api.xompet.io.vn/v1",
                username="xompet-cluster-01",
                password="••••••••••••",
                wallet_balance=500000.0,
                currency="VND",
                is_active=True
            )
            db.add(provider_acc)
            db.commit()
            print("[PostgreSQL] Seeded upstream provider account configuration (Xompet).")

        # 6. Seed Model Pricing Rate Cards
        pricing_service.ensure_seeded(db)
        print("[PostgreSQL] Seeded model pricing rate cards (gpt-image-2, dall-e-3, etc.).")

        # 7. Seed AI Providers Registry (Xompet, OpenAI)
        providers_service.ensure_seeded(db)

    except Exception as e:
        db.rollback()
        print(f"[PostgreSQL Error] Seed failed: {e}")
    finally:
        db.close()
