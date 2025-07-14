"""FastAPI application main module."""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from doctor_who_library.api.routes import conversion, library, health
from doctor_who_library.core.config import get_settings
from doctor_who_library.core.logging import setup_logging

settings = get_settings()
setup_logging(settings)

app = FastAPI(
    title="Doctor Who Library API",
    description="API for converting Excel chronology files to JSON and serving library data",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(conversion.router, prefix="/api/conversion", tags=["conversion"])
app.include_router(library.router, prefix="/api/library", tags=["library"])


def start_server():
    """Start the FastAPI server."""
    uvicorn.run(
        "doctor_who_library.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )


if __name__ == "__main__":
    start_server()