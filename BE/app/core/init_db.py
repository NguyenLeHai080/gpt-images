from datetime import datetime
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import User
from app.modules.api_keys.models import ApiKey
from app.modules.billing.models import Wallet, Transaction
from app.modules.dashboard.models import ApiActivityLog
from app.modules.generations.models import ImageGenerationJob, ProviderAccount

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

        # 4. Seed Image Generation Jobs
        job_count = db.query(ImageGenerationJob).count()
        if job_count == 0:
            sample_jobs = [
                ImageGenerationJob(
                    id="job_9981a82f",
                    user_id=admin_user.id,
                    api_key_id="key_01",
                    prompt="Một chú chó Shiba Inu đang đeo kính đọc sách trong thư viện cổ điển ánh sáng ấm",
                    model="gpt-image-2",
                    aspect_ratio="1024x1024",
                    count=1,
                    status="SUCCEEDED",
                    provider_task_id="cmtwv0sz9002vmlxpqpg5cifq",
                    provider_generation_id="cmtwv0sz9002vmlxpqpg5cifq",
                    image_url="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1024&q=80",
                    latency_ms=4820,
                    cost_provider=120.0,
                    charged_customer=150.0,
                    profit=30.0,
                    created_at=datetime(2026, 9, 13, 21, 30)
                ),
                ImageGenerationJob(
                    id="job_8812bc3d",
                    user_id=admin_user.id,
                    api_key_id="key_01",
                    prompt="Thành phố tương lai Cyberpunk với xe bay và ánh đèn neon phản chiếu mặt đường ướt",
                    model="gpt-image-2",
                    aspect_ratio="16:9",
                    count=1,
                    status="SUCCEEDED",
                    provider_task_id="cmtwu129381kaxpqpg990a",
                    provider_generation_id="cmtwu129381kaxpqpg990a",
                    image_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1024&q=80",
                    latency_ms=5210,
                    cost_provider=120.0,
                    charged_customer=150.0,
                    profit=30.0,
                    created_at=datetime(2026, 9, 13, 20, 15)
                ),
                ImageGenerationJob(
                    id="job_7721df9a",
                    user_id=admin_user.id,
                    api_key_id="key_02",
                    prompt="Logo biểu tượng năng lượng mặt trời tối giản phong cách vector 3D glassmorphism",
                    model="gpt-image-2",
                    aspect_ratio="1024x1024",
                    count=1,
                    status="SUCCEEDED",
                    provider_task_id="cmtwt891029zmlxpqpg88bb",
                    provider_generation_id="cmtwt891029zmlxpqpg88bb",
                    image_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80",
                    latency_ms=3940,
                    cost_provider=120.0,
                    charged_customer=150.0,
                    profit=30.0,
                    created_at=datetime(2026, 9, 13, 18, 40)
                ),
                ImageGenerationJob(
                    id="job_6632ee10",
                    user_id=admin_user.id,
                    api_key_id="key_03",
                    prompt="Bức tranh sơn dầu phong cảnh núi Phú Sĩ mùa thu lá đỏ soi bóng hồ nước",
                    model="gpt-image-2",
                    aspect_ratio="16:9",
                    count=1,
                    status="SUCCEEDED",
                    provider_task_id="cmtws781920zmlxpqpg77cc",
                    provider_generation_id="cmtws781920zmlxpqpg77cc",
                    image_url="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1024&q=80",
                    latency_ms=6120,
                    cost_provider=120.0,
                    charged_customer=150.0,
                    profit=30.0,
                    created_at=datetime(2026, 9, 13, 16, 10)
                ),
                ImageGenerationJob(
                    id="job_5541ff22",
                    user_id=admin_user.id,
                    api_key_id="key_02",
                    prompt="Prompt thử nghiệm vượt ngưỡng ký tự [Test error handling]",
                    model="gpt-image-2",
                    aspect_ratio="1024x1024",
                    count=1,
                    status="FAILED",
                    error_message="Invalid request format from upstream provider (rate_limit_exceeded)",
                    error_code="PROVIDER_ERR_429",
                    latency_ms=850,
                    cost_provider=0.0,
                    charged_customer=0.0,
                    profit=0.0,
                    created_at=datetime(2026, 9, 13, 15, 0)
                )
            ]
            db.add_all(sample_jobs)
            db.commit()
            print("[PostgreSQL] Seeded initial image generation jobs.")

        # 5. Seed Provider Config
        provider_acc = db.query(ProviderAccount).filter(ProviderAccount.id == "provider_default").first()
        if not provider_acc:
            provider_acc = ProviderAccount(
                id="provider_default",
                provider_name="Leeh AI Cloud (api.leeh.dev)",
                base_url="https://api.leeh.dev",
                username="willownelson",
                password="123123123",
                wallet_balance=24702.0,
                currency="VND",
                is_active=True
            )
            db.add(provider_acc)
            db.commit()
            print("[PostgreSQL] Seeded upstream provider account configuration.")

    except Exception as e:
        db.rollback()
        print(f"[PostgreSQL Error] Seed failed: {e}")
    finally:
        db.close()
