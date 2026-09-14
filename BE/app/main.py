from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.core.database import check_db_connection
from app.core.init_db import init_database
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.core.sanitizer import PayloadLimitMiddleware
from app.modules.auth.api import router as auth_router
from app.modules.dashboard.api import router as dashboard_router
from app.modules.api_keys.api import router as api_keys_router
from app.modules.billing.api import router as billing_router
from app.modules.accounts.api import router as accounts_router
from app.modules.permissions.api import router as permissions_router
from app.modules.generations.api import router as generations_router
from app.modules.packages.api import router as packages_router
from app.modules.pricing.api import router as pricing_router
from app.modules.tools.api import router as tools_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed initial data
    print("[PostgreSQL] Checking connection to database...")
    is_connected = check_db_connection()
    if is_connected:
        print("[PostgreSQL] Connected successfully. Initializing schema and seeds...")
        init_database()
    else:
        print("[PostgreSQL] Warning: Could not connect to PostgreSQL. Verify credentials in .env")
    yield
    print("[PostgreSQL] Closing connections.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API cho MintForge Business Suite - Quản trị và vận hành API, ví và tài chính doanh nghiệp với PostgreSQL",
    docs_url="/api-docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Payload Limit Shield (Max 2MB)
app.add_middleware(PayloadLimitMiddleware)

# 2. Rate Limiting Shield (Anti-DDoS / Brute-force)
app.add_middleware(RateLimitMiddleware)

# 3. OWASP Security Headers & Anti-Fingerprinting Shield
app.add_middleware(SecurityHeadersMiddleware)

# 4. CORS Protection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Global HTTP Error Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail or "Lỗi yêu cầu HTTP",
            "data": None,
            "error": {"code": f"HTTP_{exc.status_code}", "message": exc.detail or "Lỗi yêu cầu HTTP", "details": None}
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "code": "VALIDATION_ERROR",
            "message": "Dữ liệu yêu cầu không hợp lệ hoặc thiếu trường bắt buộc",
            "data": None,
            "error": {"code": "VALIDATION_ERROR", "message": "Validation error", "details": exc.errors()}
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": "INTERNAL_SERVER_ERROR",
            "message": str(exc) or "Lỗi máy chủ nội bộ",
            "data": None,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": str(exc), "details": None}
        }
    )

# Mount Modular Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(api_keys_router, prefix=settings.API_V1_STR)
app.include_router(billing_router, prefix=settings.API_V1_STR)
app.include_router(accounts_router, prefix=settings.API_V1_STR)
app.include_router(permissions_router, prefix=settings.API_V1_STR)
app.include_router(generations_router, prefix=settings.API_V1_STR)
app.include_router(packages_router, prefix=settings.API_V1_STR)
app.include_router(pricing_router, prefix=settings.API_V1_STR)
app.include_router(tools_router, prefix=settings.API_V1_STR)
# Mount thêm không prefix để hỗ trợ chuẩn OpenAI SDK client (base_url: http://127.0.0.1:8001/v1)
app.include_router(generations_router)

import os
from fastapi.staticfiles import StaticFiles
os.makedirs(settings.REFERENCES_UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/docs", include_in_schema=False)
def redirect_docs():
    return RedirectResponse(url="/api-docs")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "PostgreSQL 16 (pgsql)",
        "version": settings.VERSION,
        "docs_url": "/api-docs"
    }

@app.get("/health")
def health():
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": {
            "type": "postgresql",
            "connected": db_ok,
            "server": f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}",
            "database": settings.POSTGRES_DB
        }
    }