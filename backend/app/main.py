"""
FastAPI Application Entry Point
"""

# ========================================
# STARTUP BANNER (Runs immediately)
# ========================================
import sys
print("\n" + "="*70, file=sys.stderr)
print("🎯 Fetch Ya Job - AI Resume Parser & Screening System", file=sys.stderr)
print("="*70, file=sys.stderr)
print("⏳ Initializing application components...", file=sys.stderr)
print("="*70 + "\n", file=sys.stderr)
sys.stderr.flush()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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
    print("⚠️  Users router not found - skipping", file=sys.stderr)

try:
    from app.routers.chat import router as chat_router
    HAS_CHAT = True
except (ImportError, ModuleNotFoundError):
    HAS_CHAT = False
    print("⚠️  Chat router not found - skipping", file=sys.stderr)

# ========================================
# CREATE TABLES
# ========================================
print("📊 Creating database tables...", file=sys.stderr)
Base.metadata.create_all(bind=engine)
print("✅ Database tables ready", file=sys.stderr)

# ========================================
# INITIALIZE FASTAPI APP
# ========================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered resume screening and job matching system",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

print(f"✅ FastAPI app initialized: {settings.APP_NAME} v{settings.APP_VERSION}", file=sys.stderr)

# ========================================
# STARTUP EVENT
# ========================================
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    sys.stdout.flush()
    sys.stderr.flush()
    
    print("\n" + "="*70, file=sys.stderr)
    print("🚀 APPLICATION STARTUP", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    # Create all necessary directories
    print("\n📁 Setting up directories...", file=sys.stderr)
    ensure_directories_exist()
    
    # Display settings in debug mode
    if settings.DEBUG:
        print("\n🔧 Configuration:", file=sys.stderr)
        display_settings()
    
    print("\n" + "="*70, file=sys.stderr)
    print("✅ APPLICATION READY!", file=sys.stderr)
    print("="*70, file=sys.stderr)
    print("\n🌐 Access Points:", file=sys.stderr)
    print("   📚 API Docs:  http://localhost:8000/api/docs", file=sys.stderr)
    print("   📖 ReDoc:     http://localhost:8000/api/redoc", file=sys.stderr)
    print("   ❤️  Health:    http://localhost:8000/health", file=sys.stderr)
    print("   🏠 Root:      http://localhost:8000/", file=sys.stderr)
    print("="*70 + "\n", file=sys.stderr)
    
    sys.stderr.flush()


# ========================================
# SHUTDOWN EVENT
# ========================================
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("\n" + "="*70, file=sys.stderr)
    print("🛑 SHUTTING DOWN APPLICATION", file=sys.stderr)
    print("="*70, file=sys.stderr)
    print("✅ Cleanup completed!", file=sys.stderr)
    print("="*70 + "\n", file=sys.stderr)


# ========================================
# CORS MIDDLEWARE
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("✅ CORS middleware configured", file=sys.stderr)

# ========================================
# STATIC FILES
# ========================================
if os.path.exists(settings.UPLOAD_DIR):
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="uploads"
    )
    print(f"✅ Static files mounted: {settings.UPLOAD_DIR}", file=sys.stderr)

# ========================================
# ROUTERS
# ========================================
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs & Applications"])

if HAS_USERS:
    app.include_router(users_router, prefix="/users", tags=["Users"])

if HAS_CHAT:
    app.include_router(chat_router, prefix="/chat", tags=["Chat"])

print(f"✅ Routers registered: auth, jobs{', users' if HAS_USERS else ''}{', chat' if HAS_CHAT else ''}", file=sys.stderr)

# ========================================
# ROOT ENDPOINT
# ========================================
@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "redoc": "/api/redoc",
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
# ========================================
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url)
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "details": str(exc) if settings.DEBUG else "Contact support"
        }
    )

print("✅ Error handlers registered\n", file=sys.stderr)