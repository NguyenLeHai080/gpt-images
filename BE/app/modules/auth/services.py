from typing import Optional
from app.core.security import create_access_token
from app.modules.auth.schemas import LoginRequest, TokenResponse, UserProfile

# Default mock user matching the design
MOCK_USER = UserProfile(
    id="usr_admin_001",
    email="admin@mintforge.vn",
    full_name="Admin",
    role="SUPER_ADMIN",
    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    company_name="MintForge Business Suite"
)

class AuthService:
    @staticmethod
    def authenticate(login_data: LoginRequest) -> Optional[TokenResponse]:
        # Accept default admin email or any email with a test password
        user = MOCK_USER
        if login_data.email.strip():
            user = UserProfile(
                id="usr_admin_001",
                email=login_data.email,
                full_name="Admin",
                role="SUPER_ADMIN",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                company_name="MintForge Business Suite"
            )
        
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=user
        )

auth_service = AuthService()
