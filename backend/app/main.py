"""
FastAPI Application Entry Point
"""

import sys
import logging

# ========================================
# LOGGING SETUP (replaces print() to stderr)
# FIX: Use proper logging instead of raw print statements in production
# ========================================
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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.config import settings, ensure_directories_exist, display_settings

# Import required routers
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router

# Try to import optional routers
try:
    from app.routers.users import router as users_router
    HAS_USERS = True
except (ImportError, ModuleNotFoundError):
    HAS_USERS = False
    logger.warning("Users router not found - skipping")

try:
    from app.routers.chat import router as chat_router
    HAS_CHAT = True
except (ImportError, ModuleNotFoundError):
    HAS_CHAT = False
    logger.warning("Chat router not found - skipping")

# ========================================
# CREATE TABLES
# ========================================
logger.info("Creating database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database tables ready")


# ========================================
# LIFESPAN (replaces deprecated @app.on_event)
# FIX: on_event("startup") is deprecated in FastAPI >= 0.93 — use lifespan
# ========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic"""
    # --- STARTUP ---
    logger.info("=" * 70)
    logger.info("APPLICATION STARTUP")
    logger.info("=" * 70)

    ensure_directories_exist()

    if settings.DEBUG:
        logger.info("Debug mode ON — displaying settings")
        display_settings()

    logger.info("APPLICATION READY!")
    logger.info("API Docs:  http://localhost:8000/api/docs")
    logger.info("Health:    http://localhost:8000/health")

    yield  # App runs here

    # --- SHUTDOWN ---
    logger.info("SHUTTING DOWN APPLICATION - cleanup completed")


# ========================================
# INITIALIZE FASTAPI APP
# FIX: Disable docs_url/redoc_url in production (DEBUG=False)
# ========================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered resume screening and job matching system",
    # FIX: Only expose API docs when in DEBUG mode
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

logger.info(f"FastAPI app initialized: {settings.APP_NAME} v{settings.APP_VERSION}")

# ========================================
# CORS MIDDLEWARE
# FIX: Origins come from settings (environment variable), not hardcoded
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for origins: {settings.cors_origins_list}")

# ========================================
# STATIC FILES
# ========================================
if os.path.exists(settings.UPLOAD_DIR):
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="uploads"
    )
    logger.info(f"Static files mounted: {settings.UPLOAD_DIR}")

# ========================================
# ROUTERS
# ========================================
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs & Applications"])

if HAS_USERS:
    app.include_router(users_router, prefix="/users", tags=["Users"])

if HAS_CHAT:
    app.include_router(chat_router, prefix="/chat", tags=["Chat"])

logger.info(f"Routers registered: auth, jobs{', users' if HAS_USERS else ''}{', chat' if HAS_CHAT else ''}")


# ========================================
# ROOT ENDPOINT
# ========================================
@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "health": "/health",
        "status": "running"
    }


# ========================================
# HEALTH CHECK
# ========================================
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
            "users_router": HAS_USERS,
            "chat_router": HAS_CHAT,
            "ai_scoring": settings.AI_SCORING_ENABLED,
            "smtp": settings.smtp_enabled
        }
    }


# ========================================
# ERROR HANDLERS
# FIX: Never expose exception details in production (DEBUG=False)
# ========================================
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            # FIX: Only expose path in debug mode
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
            # FIX: Never leak exception details in production
            "details": str(exc) if settings.DEBUG else "Contact support"
        }
    )

logger.info("Error handlers registered")