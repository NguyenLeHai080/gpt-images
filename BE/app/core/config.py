import os

class Settings:
    PROJECT_NAME: str = "MintForge Business Suite API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mintforge-super-secret-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # PostgreSQL Database Configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "mintforge_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "mintforge_secure_2026")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "127.0.0.1")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "mintforge_db")
    
    @property
    def DATABASE_URL(self) -> str:
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Connection Pool settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Public Gateway Base URL for Upstream Reference Delivery
    PUBLIC_API_URL: str = os.getenv("PUBLIC_API_URL", "https://api-gpt-images.nexoratech.com.vn")

    # Upstream AI Provider Configuration (Xompet / Cunai Gateway)
    UPSTREAM_PROVIDER_NAME: str = os.getenv("UPSTREAM_PROVIDER_NAME", "Xompet AI Gateway")
    UPSTREAM_PROVIDER_URL: str = os.getenv("UPSTREAM_PROVIDER_URL", "https://api.xompet.io.vn/v1")
    UPSTREAM_PROVIDER_KEY: str = os.getenv("UPSTREAM_PROVIDER_KEY", "sk-9r-N17BHJNt9a4E2TlrCdhHq3fvdIsiLnzz")
    UPSTREAM_DEFAULT_IMAGE_MODEL: str = os.getenv("UPSTREAM_DEFAULT_IMAGE_MODEL", "gpt-image-2.5-flare")

    # Upload Directories
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REFERENCES_UPLOAD_DIR: str = os.path.join(UPLOAD_DIR, "references")

settings = Settings()
