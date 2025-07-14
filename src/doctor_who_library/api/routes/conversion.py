"""Data status endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from doctor_who_library.database import get_db, LibraryItem

router = APIRouter()


@router.get("/status")
async def get_data_status(db: Session = Depends(get_db)):
    """Get data population status."""
    total_items = db.query(LibraryItem).count()
    
    return {
        "status": "ready" if total_items > 0 else "empty",
        "message": "Data populated by developers" if total_items > 0 else "No data available",
        "total_items": total_items,
        "note": "Data is populated by developers using CLI tools"
    }