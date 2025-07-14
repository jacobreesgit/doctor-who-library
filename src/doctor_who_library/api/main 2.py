"""FastAPI application entry point."""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from doctor_who_library.api.v1.router import api_router
from doctor_who_library.core.config import get_settings

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Doctor Who Library API",
    description="A comprehensive API for Doctor Who chronology data with metadata enrichment",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Doctor Who Library API",
        "version": settings.version,
        "docs": "/docs",
        "api": "/api/v1"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.version}


def main():
    """Start the FastAPI server."""
    uvicorn.run(
        "doctor_who_library.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()