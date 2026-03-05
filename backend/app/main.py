"""
FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.sessions import SessionMiddleware
import os

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

logger.info("=" * 70)
logger.info("Fetch Ya Job - AI Resume Parser & Screening System")
logger.info("=" * 70)
logger.info("Initializing application components...")

from app.database import engine, Base
from app.config import settings, ensure_directories_exist, display_settings

# ── REQUIRED routers — must always load ──────────────────────
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router

# ── OPTIONAL routers — wrapped so one crash can't kill auth ──
HAS_NOTIFICATIONS = False
HAS_OAUTH         = False
HAS_USERS         = False
HAS_CHAT          = False

try:
    from app.routers.notifications import router as notifications_router
    HAS_NOTIFICATIONS = True
    logger.info("✓ notifications router loaded")
except Exception as e:
    logger.warning(f"✗ notifications router skipped: {e}")

try:
    from app.routers.oauth import router as oauth_router
    HAS_OAUTH = True
    logger.info("✓ oauth router loaded")
except Exception as e:
    logger.warning(f"✗ oauth router skipped: {e}")

try:
    from app.routers.users import router as users_router
    HAS_USERS = True
    logger.info("✓ users router loaded")
except Exception as e:
    logger.warning(f"✗ users router skipped: {e}")

try:
    from app.routers.chat import router as chat_router
    HAS_CHAT = True
    logger.info("✓ chat router loaded")
except Exception as e:
    logger.warning(f"✗ chat router skipped: {e}")

# ── Create DB tables ──────────────────────────────────────────
logger.info("Creating database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database tables ready")


# ── Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 70)
    logger.info("APPLICATION STARTUP")
    logger.info("=" * 70)
    ensure_directories_exist()
    if settings.DEBUG:
        logger.info("Debug mode ON — displaying settings")
        display_settings()
    logger.info("APPLICATION READY!")
    logger.info("API Docs: http://localhost:8000/api/docs")
    logger.info("Health:   http://localhost:8000/health")
    yield
    logger.info("SHUTTING DOWN APPLICATION - cleanup completed")


# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered resume screening and job matching system",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

logger.info(f"FastAPI app initialized: {settings.APP_NAME} v{settings.APP_VERSION}")

# ── Session middleware — MUST be added before CORS ────────────
# Required for OAuth CSRF state storage
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    same_site="lax",
    https_only=False,   # False for local dev; set True in production
    max_age=3600,
)

# ── CORS middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS configured for origins: {settings.cors_origins_list}")

# ── Static files ──────────────────────────────────────────────
if os.path.exists(settings.UPLOAD_DIR):
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="uploads"
    )
    logger.info(f"Static files mounted: {settings.UPLOAD_DIR}")

# ═════════════════════════════════════════════════════════════
# ROUTERS — ORDER AND PREFIXES ARE CRITICAL
# auth_router  → /auth   (register, login, me)
# jobs_router  → /jobs
# notifications_router → /notifications
# oauth_router → /oauth  ← NOTE: /oauth NOT /auth
# users_router → /users
# chat_router  → /chat
# ═════════════════════════════════════════════════════════════
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs & Applications"])

if HAS_NOTIFICATIONS:
    app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

if HAS_OAUTH:
    app.include_router(oauth_router, prefix="/oauth", tags=["OAuth"])   # ← /oauth NOT /auth

if HAS_USERS:
    app.include_router(users_router, prefix="/users", tags=["Users"])

if HAS_CHAT:
    app.include_router(chat_router, prefix="/chat", tags=["Chat"])

logger.info(
    f"Routers: auth ✓, jobs ✓"
    f"{', notifications ✓' if HAS_NOTIFICATIONS else ', notifications ✗'}"
    f"{', oauth ✓' if HAS_OAUTH else ', oauth ✗'}"
    f"{', users ✓' if HAS_USERS else ''}"
    f"{', chat ✓' if HAS_CHAT else ''}"
)


# ── Root endpoint ─────────────────────────────────────────────
@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "health": "/health",
        "status": "running"
    }


# ── Health check ──────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected",
        "uploads_dir": os.path.exists(settings.UPLOAD_DIR),
        "downloads_dir": os.path.exists(settings.DOWNLOADS_DIR),
        "features": {
            "notifications": HAS_NOTIFICATIONS,
            "oauth": HAS_OAUTH,
            "users_router": HAS_USERS,
            "chat_router": HAS_CHAT,
            "ai_scoring": settings.AI_SCORING_ENABLED,
            "smtp": settings.smtp_enabled,
        }
    }


# ── Error handlers ────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """422 Validation errors — always show details so bugs are visible"""
    logger.error(f"Validation error on {request.method} {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Request body is invalid",
            "details": exc.errors()
        }
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url) if settings.DEBUG else None
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Custom 500 handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "details": str(exc) if settings.DEBUG else "Contact support"
        }
    )


logger.info("App fully initialized ✓")