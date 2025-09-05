"""
AI Child Health - Main FastAPI Application
Malnutrition & Growth Monitoring Tool
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.api.endpoints import auth, children, growth, photos

# Create FastAPI app instance
app = FastAPI(
    title="AI Child Health",
    description="AI-powered malnutrition detection and growth monitoring tool for Village Health Teams",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(children.router, prefix="/api/v1", tags=["children"])
app.include_router(growth.router, prefix="/api/v1", tags=["growth"])
app.include_router(photos.router, prefix="/api/v1/photos", tags=["photos"])

@app.get("/")
async def root():
    """Root endpoint with basic project information"""
    return {
        "message": "AI Child Health API",
        "description": "Malnutrition detection and growth monitoring tool",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "AI Child Health API",
        "timestamp": "2024-01-30T16:00:00Z"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": "HTTP Error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
