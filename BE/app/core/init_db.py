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

        # 2. Seed Wallets for Users
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

        # 5. Model Pricing Rate Cards
        pricing_service.ensure_seeded(db)
        print("[PostgreSQL] Seeded model pricing rate cards (gpt-image-2, dall-e-3, etc.).")

        # 6. AI Providers Registry (Clean state, user configures via UI)
        providers_service.ensure_seeded(db)

    except Exception as e:
        db.rollback()
        print(f"[PostgreSQL Error] Seed failed: {e}")
    finally:
        db.close()
