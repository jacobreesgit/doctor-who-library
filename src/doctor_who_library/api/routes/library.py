"""Library data endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from doctor_who_library.database import get_db, LibraryItem, LibrarySection, LibraryGroup

router = APIRouter()


class LibraryItemResponse(BaseModel):
    """Response model for library item."""
    id: str
    title: str
    display_title: str
    content_type: Optional[str]
    doctor: Optional[str]
    companions: Optional[str]
    writer: Optional[str]
    director: Optional[str]
    enrichment_status: str
    enrichment_confidence: float
    
    class Config:
        from_attributes = True


class LibraryStatsResponse(BaseModel):
    """Response model for library statistics."""
    total_items: int
    total_sections: int
    total_groups: int
    enrichment_stats: dict
    note: str = "Data is enriched by developers using CLI tools"


@router.get("/items", response_model=List[LibraryItemResponse])
async def get_library_items(
    section: Optional[str] = Query(None, description="Filter by section"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    doctor: Optional[str] = Query(None, description="Filter by doctor"),
    limit: int = Query(50, le=1000, description="Maximum items to return"),
    offset: int = Query(0, description="Number of items to skip"),
    db: Session = Depends(get_db),
):
    """Get library items with filtering and pagination."""
    query = db.query(LibraryItem)
    
    if section:
        query = query.filter(LibraryItem.section_name == section)
    if content_type:
        query = query.filter(LibraryItem.content_type == content_type)
    if doctor:
        query = query.filter(LibraryItem.doctor == doctor)
    
    items = query.offset(offset).limit(limit).all()
    
    return [LibraryItemResponse.from_orm(item) for item in items]


@router.get("/items/{item_id}", response_model=LibraryItemResponse)
async def get_library_item(
    item_id: str,
    db: Session = Depends(get_db),
):
    """Get a specific library item by ID."""
    item = db.query(LibraryItem).filter(LibraryItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Library item not found"
        )
    
    return LibraryItemResponse.from_orm(item)


@router.get("/stats", response_model=LibraryStatsResponse)
async def get_library_stats(db: Session = Depends(get_db)):
    """Get library statistics."""
    total_items = db.query(LibraryItem).count()
    total_sections = db.query(LibrarySection).count()
    total_groups = db.query(LibraryGroup).count()
    
    # Enrichment stats
    enrichment_stats = {}
    for status in ["pending", "enriched", "failed", "skipped"]:
        count = db.query(LibraryItem).filter(
            LibraryItem.enrichment_status == status
        ).count()
        enrichment_stats[status] = count
    
    return LibraryStatsResponse(
        total_items=total_items,
        total_sections=total_sections,
        total_groups=total_groups,
        enrichment_stats=enrichment_stats,
        note="Data is enriched by developers using CLI tools"
    )


@router.get("/sections")
async def get_library_sections(db: Session = Depends(get_db)):
    """Get all library sections."""
    sections = db.query(LibrarySection).order_by(LibrarySection.sort_order).all()
    return [{"id": str(s.id), "name": s.name, "display_name": s.display_name} for s in sections]


@router.get("/search")
async def search_library(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, le=100, description="Maximum results"),
    db: Session = Depends(get_db),
):
    """Search library items."""
    query = db.query(LibraryItem).filter(
        LibraryItem.title.contains(q) |
        LibraryItem.story_title.contains(q) |
        LibraryItem.episode_title.contains(q)
    )
    
    items = query.limit(limit).all()
    
    return {
        "query": q,
        "total_results": len(items),
        "results": [LibraryItemResponse.from_orm(item) for item in items]
    }