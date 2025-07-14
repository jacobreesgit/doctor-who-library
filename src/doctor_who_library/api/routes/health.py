"""Health check endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from doctor_who_library.database import get_db
from doctor_who_library.core.config import get_settings

router = APIRouter()
settings = get_settings()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    message: str
    version: str
    database: str


@router.get("/", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    # Test database connection
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return HealthResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        message="Doctor Who Library API is running",
        version="1.0.0",
        database=db_status
    )


@router.get("/ready", response_model=HealthResponse)
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness check endpoint."""
    # Test database connection
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return HealthResponse(
        status="ready" if db_status == "connected" else "not_ready",
        message="API is ready to serve requests",
        version="1.0.0",
        database=db_status
    )