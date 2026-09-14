import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import User
from app.modules.accounts.schemas import (
    CreateUserRequest,
    UpdateUserRequest,
    UpdateRoleRequest,
    ToggleStatusRequest,
    UserAccountResponse,
    AccountStatsResponse
)

class AccountsService:
    @staticmethod
    def get_accounts(
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Tuple[List[UserAccountResponse], AccountStatsResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # Base query
            query = db.query(User)

            # Filter search
            if search:
                term = f"%{search.strip()}%"
                query = query.filter(
                    or_(
                        User.email.ilike(term),
                        User.full_name.ilike(term),
                        User.company_name.ilike(term)
                    )
                )

            # Filter role
            if role and role.upper() != "ALL":
                query = query.filter(User.role == role.upper())

            # Filter status
            if status and status.lower() != "all":
                if status.lower() == "active":
                    query = query.filter(User.is_active == True)
                elif status.lower() == "inactive":
                    query = query.filter(User.is_active == False)

            users = query.order_by(User.created_at.desc()).all()

            # Global stats query
            all_users = db.query(User).all()
            total = len(all_users)
            active_count = sum(1 for u in all_users if u.is_active)
            inactive_count = total - active_count
            super_admins = sum(1 for u in all_users if u.role == "SUPER_ADMIN")
            admins = sum(1 for u in all_users if u.role == "ADMIN")
            developers = sum(1 for u in all_users if u.role == "DEVELOPER")
            members = sum(1 for u in all_users if u.role == "MEMBER")

            stats = AccountStatsResponse(
                total_users=total,
                active_users=active_count,
                inactive_users=inactive_count,
                super_admins=super_admins,
                admins=admins,
                developers=developers,
                members=members
            )

            user_responses = [
                UserAccountResponse(
                    id=u.id,
                    email=u.email,
                    full_name=u.full_name,
                    role=u.role,
                    company_name=u.company_name,
                    avatar_url=u.avatar_url,
                    is_active=u.is_active,
                    has_provider_key=bool(u.provider_api_key),
                    provider_key_masked=(u.provider_api_key[:8] + "••••••••") if u.provider_api_key else None,
                    created_at=u.created_at
                )
                for u in users
            ]

            return user_responses, stats
        finally:
            if close_session:
                db.close()

    @staticmethod
    def create_user(payload: CreateUserRequest, db: Optional[Session] = None) -> Optional[UserAccountResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
            if existing:
                return None

            new_user = User(
                id=f"user_{uuid.uuid4().hex[:8]}",
                email=payload.email.strip().lower(),
                hashed_password=get_password_hash(payload.password),
                full_name=payload.full_name.strip(),
                role=payload.role.upper(),
                company_name=payload.company_name.strip(),
                is_active=payload.is_active,
                provider_api_key=payload.provider_api_key.strip() if payload.provider_api_key else None
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            return UserAccountResponse(
                id=new_user.id,
                email=new_user.email,
                full_name=new_user.full_name,
                role=new_user.role,
                company_name=new_user.company_name,
                avatar_url=new_user.avatar_url,
                is_active=new_user.is_active,
                has_provider_key=bool(new_user.provider_api_key),
                provider_key_masked=(new_user.provider_api_key[:8] + "••••••••") if new_user.provider_api_key else None,
                created_at=new_user.created_at
            )

        finally:
            if close_session:
                db.close()

    @staticmethod
    def update_role(user_id: str, role: str, db: Optional[Session] = None) -> Optional[UserAccountResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            user.role = role.upper()
            db.commit()
            db.refresh(user)

            return UserAccountResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                company_name=user.company_name,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                created_at=user.created_at
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def toggle_status(user_id: str, is_active: bool, db: Optional[Session] = None) -> Optional[UserAccountResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            user.is_active = is_active
            db.commit()
            db.refresh(user)

            return UserAccountResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                company_name=user.company_name,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                created_at=user.created_at
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def delete_user(user_id: str, db: Optional[Session] = None) -> bool:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            # Protect root super admin
            if user.email == "admin@mintforge.vn":
                return False

            db.delete(user)
            db.commit()
            return True
        finally:
            if close_session:
                db.close()

    @staticmethod
    def update_user(user_id: str, payload: UpdateUserRequest, db: Optional[Session] = None) -> Optional[UserAccountResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            if payload.full_name is not None:
                user.full_name = payload.full_name.strip()
            if payload.email is not None and payload.email.strip().lower() != user.email:
                existing = db.query(User).filter(User.email == payload.email.strip().lower(), User.id != user_id).first()
                if existing:
                    raise ValueError(f"Email '{payload.email}' đã được sử dụng bởi tài khoản khác")
                user.email = payload.email.strip().lower()
            if payload.company_name is not None:
                user.company_name = payload.company_name.strip()
            if payload.role is not None:
                if user.email == "admin@mintforge.vn" and payload.role.upper() != "SUPER_ADMIN":
                    raise ValueError("Không thể thay đổi vai trò của tài khoản Super Admin gốc")
                user.role = payload.role.upper()
            if payload.is_active is not None:
                if user.email == "admin@mintforge.vn" and not payload.is_active:
                    raise ValueError("Không thể khóa tài khoản Super Admin gốc")
                user.is_active = payload.is_active
            if payload.password:
                user.hashed_password = get_password_hash(payload.password)
            if payload.provider_api_key is not None:
                user.provider_api_key = payload.provider_api_key.strip() if payload.provider_api_key else None

            db.commit()
            db.refresh(user)

            return UserAccountResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                company_name=user.company_name,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                has_provider_key=bool(user.provider_api_key),
                provider_key_masked=(user.provider_api_key[:8] + "••••••••") if user.provider_api_key else None,
                created_at=user.created_at
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def update_provider_key(user_id: str, provider_key: str, db: Optional[Session] = None) -> Optional[UserAccountResponse]:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            user.provider_api_key = provider_key.strip() if provider_key else None
            db.commit()
            db.refresh(user)

            return UserAccountResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                company_name=user.company_name,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                has_provider_key=bool(user.provider_api_key),
                provider_key_masked=(user.provider_api_key[:8] + "••••••••") if user.provider_api_key else None,
                created_at=user.created_at
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def change_password(user_id: str, new_password: str, db: Optional[Session] = None) -> bool:

        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            user.hashed_password = get_password_hash(new_password)
            db.commit()
            return True
        finally:
            if close_session:
                db.close()

accounts_service = AccountsService()
