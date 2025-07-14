"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from doctor_who_library.core.config import get_settings
from doctor_who_library.api.routes import conversion, library, health

settings = get_settings()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Doctor Who Library API",
        description="A Plex-style media browser for Doctor Who content with TARDIS Wiki integration",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(health.router, prefix="/api/health", tags=["health"])
    app.include_router(conversion.router, prefix="/api/data", tags=["data"])
    app.include_router(library.router, prefix="/api/library", tags=["library"])
    
    return app


app = create_app()