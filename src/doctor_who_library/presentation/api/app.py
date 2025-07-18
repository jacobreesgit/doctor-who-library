"""Modern FastAPI application with dependency injection."""

import asyncio
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import create_async_engine
from starlette.exceptions import HTTPException as StarletteHTTPException

from doctor_who_library.infrastructure.database.models import Base
from doctor_who_library.presentation.api.routes.dev import router as dev_router
from doctor_who_library.presentation.api.routes.enrichment import (
    router as enrichment_router,
)
from doctor_who_library.presentation.api.routes.enrichment_display import (
    router as enrichment_display_router,
)
from doctor_who_library.presentation.api.routes.library import router as library_router
from doctor_who_library.shared.config.container import get_container, wire_container
from doctor_who_library.shared.config.settings import get_settings
from doctor_who_library.shared.exceptions.base import DoctorWhoLibraryException

logger = structlog.get_logger()


async def background_enrichment_task():
    """Background task that continuously enriches pending items."""
    logger.info("Starting background enrichment task")

    # Get enrichment service from container
    container = get_container()
    enrichment_service = container.enrichment_service()

    while True:
        try:
            # Process items in smaller batches to avoid overwhelming the system
            results = await enrichment_service.enrich_pending_items(
                batch_size=5,  # Small batch size for continuous processing
                max_items=10,  # Process up to 10 items at a time
            )

            if results["processed"] > 0:
                logger.info(
                    "Background enrichment completed",
                    processed=results["processed"],
                    enriched=results["enriched"],
                    failed=results["failed"],
                    skipped=results["skipped"],
                    avg_confidence=results.get("avg_confidence", 0.0),
                )
            else:
                # No items to process, wait longer before next check
                await asyncio.sleep(30)

        except Exception as e:
            logger.error("Background enrichment error", error=str(e))
            await asyncio.sleep(60)  # Wait longer on error

        # Wait before next batch
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting up Doctor Who Library API")

    # Wire dependency injection
    wire_container()

    # Create database tables
    settings = get_settings()
    engine = create_async_engine(settings.database.url)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created")

    # Start background enrichment task
    enrichment_task = asyncio.create_task(background_enrichment_task())
    logger.info("Background enrichment task started")

    yield

    # Shutdown
    logger.info("Shutting down Doctor Who Library API")
    enrichment_task.cancel()
    try:
        await enrichment_task
    except asyncio.CancelledError:
        logger.info("Background enrichment task cancelled")
    await engine.dispose()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="A modern Doctor Who media library with TARDIS Wiki integration",
        docs_url=settings.api.docs_url,
        redoc_url=settings.api.redoc_url,
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add custom exception handlers
    @app.exception_handler(DoctorWhoLibraryException)
    async def custom_exception_handler(
        request: Request, exc: DoctorWhoLibraryException
    ):
        """Handle custom application exceptions."""
        logger.error(
            "Application error",
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
            path=request.url.path,
        )

        status_code = 500
        if "NOT_FOUND" in (exc.error_code or ""):
            status_code = 404
        elif "VALIDATION" in (exc.error_code or ""):
            status_code = 400
        elif "EXTERNAL_SERVICE" in (exc.error_code or ""):
            status_code = 503

        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Handle validation errors."""
        logger.error(
            "Validation error",
            errors=exc.errors(),
            path=request.url.path,
        )

        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request data",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions."""
        logger.error(
            "HTTP error",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions."""
        logger.error(
            "Unexpected error",
            error=str(exc),
            path=request.url.path,
            exc_info=True,
        )

        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                }
            },
        )

    # Add middleware for request logging
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log HTTP requests."""
        logger.info(
            "Request started",
            method=request.method,
            path=request.url.path,
            query_params=dict(request.query_params),
        )

        response = await call_next(request)

        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )

        return response

    # Add health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "Doctor Who Library API"}

    # Include routers
    app.include_router(library_router)
    app.include_router(enrichment_router)
    app.include_router(enrichment_display_router)
    app.include_router(dev_router)

    return app


# Create application instance
app = create_app()
