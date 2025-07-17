"""Modern API routes for library operations."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from dependency_injector.wiring import inject, Provide
from pydantic import BaseModel, Field

from doctor_who_library.application.services.library_service import LibraryService
from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.shared.config.container import Container
from doctor_who_library.shared.exceptions.domain import EntityNotFoundException
from doctor_who_library.shared.exceptions.application import ServiceException
import structlog

logger = structlog.get_logger()


# Response models
class LibraryItemResponse(BaseModel):
    """Response model for library items."""
    
    id: UUID
    title: str
    display_title: Optional[str] = None
    story_title: Optional[str] = None
    episode_title: Optional[str] = None
    serial_title: Optional[str] = None
    content_type: Optional[str] = None
    section_name: Optional[str] = None
    group_name: Optional[str] = None
    doctor: Optional[str] = None
    companions: Optional[str] = None
    writer: Optional[str] = None
    director: Optional[str] = None
    producer: Optional[str] = None
    story_number: Optional[str] = None
    series: Optional[str] = None
    format: Optional[str] = None
    duration: Optional[str] = None
    broadcast_date: Optional[datetime] = None
    release_date: Optional[datetime] = None
    cover_date: Optional[datetime] = None
    enrichment_status: str
    enrichment_confidence: float
    enrichment_error: Optional[str] = None
    wiki_url: Optional[str] = None
    wiki_summary: Optional[str] = None
    wiki_image_url: Optional[str] = None
    wiki_search_term: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class LibraryStatsResponse(BaseModel):
    """Response model for library statistics."""
    
    total_items: int
    total_sections: int
    total_groups: int
    enrichment_stats: Dict[str, int]
    note: str


class PaginatedLibraryResponse(BaseModel):
    """Response model for paginated library items."""
    
    items: List[LibraryItemResponse]
    total: int
    page: int
    size: int
    pages: int


# Create router
router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("/items", response_model=PaginatedLibraryResponse)
@inject
async def get_library_items(
    limit: int = Query(50, ge=1, description="Number of items to return (no upper limit)"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    section: Optional[str] = Query(None, description="Filter by section"),
    group: Optional[str] = Query(None, description="Filter by group"),
    enrichment_status: Optional[str] = Query(None, description="Filter by enrichment status"),
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> PaginatedLibraryResponse:
    """Get paginated library items with optional filtering."""
    try:
        
        if enrichment_status:
            # Validate and convert string to enum
            from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
            try:
                status_enum = EnrichmentStatus(enrichment_status)
            except ValueError:
                valid_statuses = [status.value for status in EnrichmentStatus]
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid enrichment_status '{enrichment_status}'. Valid values: {valid_statuses}"
                )
            
            items = await service.get_items_by_status(status_enum)
            total = len(items)
            items = items[offset:offset + limit]
        elif section:
            items = await service.get_items_by_section(section)
            total = len(items)
            items = items[offset:offset + limit]
        elif group:
            items = await service.get_items_by_group(group)
            total = len(items)
            items = items[offset:offset + limit]
        else:
            # For unfiltered results, get total count efficiently
            total = await service.get_total_count()
            items = await service.get_all_items(limit=limit, offset=offset)
        
        # Calculate pagination info  
        page = (offset // limit) + 1 if limit > 0 else 1
        pages = (total + limit - 1) // limit if limit > 0 else 1
        
        # Convert items to response format with proper error handling
        response_items = []
        for item in items:
            try:
                response_item = LibraryItemResponse.model_validate(item)
                response_items.append(response_item)
            except Exception as e:
                logger.error(f"Failed to convert item {item.id} to response format: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Data conversion error for item {item.id}: {str(e)}"
                )
        
        return PaginatedLibraryResponse(
            items=response_items,
            total=total,
            page=page,
            size=limit,
            pages=pages,
        )
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/items/{item_id}", response_model=LibraryItemResponse)
@inject
async def get_library_item(
    item_id: UUID,
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> LibraryItemResponse:
    """Get a specific library item by ID."""
    try:
        item = await service.get_item_by_id(item_id)
        return LibraryItemResponse.model_validate(item)
    except EntityNotFoundException:
        raise HTTPException(status_code=404, detail="Library item not found")
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search", response_model=List[LibraryItemResponse])
@inject
async def search_library_items(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, description="Maximum results (no upper limit)"),
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> List[LibraryItemResponse]:
    """Search library items by query."""
    try:
        items = await service.search_items(q, limit=limit)
        return [LibraryItemResponse.model_validate(item) for item in items]
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=LibraryStatsResponse)
@inject
async def get_library_stats(
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> LibraryStatsResponse:
    """Get library statistics."""
    try:
        stats = await service.get_library_stats()
        return LibraryStatsResponse(**stats)
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/sections", response_model=List[str])
@inject
async def get_library_sections(
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> List[str]:
    """Get all unique library sections."""
    try:
        # This is a simplified implementation
        # In production, we'd need a proper sections repository
        items = await service.get_all_items()
        sections = list(set(item.section_name for item in items if item.section_name))
        return sorted(sections)
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/groups", response_model=List[str])
@inject
async def get_library_groups(
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> List[str]:
    """Get all unique library groups."""
    try:
        # This is a simplified implementation
        # In production, we'd need a proper groups repository
        items = await service.get_all_items()
        groups = list(set(item.group_name for item in items if item.group_name))
        return sorted(groups)
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")