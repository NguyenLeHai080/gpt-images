from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.modules.auth.models import User

security_scheme = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """Cung cấp session kết nối PostgreSQL an toàn cho từng request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    request: Request,
    token_auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực Bearer JWT token từ request.
    Nếu không có token, token hết hạn hoặc tài khoản bị khóa -> ném lỗi 401 Unauthorized.
    """
    token: Optional[str] = None
    if token_auth and token_auth.credentials:
        token = token_auth.credentials
    else:
        # Hỗ trợ lấy Authorization header trực tiếp nếu không qua HTTPBearer
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu xác thực Bearer Token hợp lệ để truy cập",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã truy cập không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload["sub"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng gắn với token không tồn tại trong hệ thống",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa",
        )

    return user

def require_roles(allowed_roles: List[str]):
    """
    Dependency kiểm tra quyền hạn RBAC của người dùng.
    Ví dụ: Depends(require_roles(['SUPER_ADMIN', 'ADMIN']))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối. Yêu cầu một trong các vai trò: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker

def get_optional_user(
    request: Request,
    token_auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Trả về current User nếu token hợp lệ, ngược lại trả về None mà không ngắt request."""
    try:
        return get_current_user(request, token_auth, db)
    except Exception:
        return None
