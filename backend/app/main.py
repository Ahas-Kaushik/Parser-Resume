"""
Fetch Ya Job - Main Application
FastAPI application with all routes and middleware
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db
from app.routers import auth, jobs, chat

# Create FastAPI application
app = FastAPI(
    title="Fetch Ya Job",
    version="1.0.0",
    description="AI-powered job portal with resume screening and glassmorphism UI",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware - FIXED VERSION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs & Applications"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print("=" * 60)
    print(f"✓ Fetch Ya Job v1.0.0 started!")
    print(f"✓ API Documentation: http://localhost:8000/docs")
    print(f"✓ CORS enabled for:")
    print(f"  - http://localhost:5173")
    print(f"  - http://127.0.0.1:5173")
    print("=" * 60)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "app": "Fetch Ya Job",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "app": "Fetch Ya Job",
        "version": "1.0.0"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"❌ Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc)
        }
    )