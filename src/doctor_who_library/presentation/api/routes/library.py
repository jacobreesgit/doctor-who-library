"""Modern API routes for library operations."""

from datetime import datetime
from typing import Any
from uuid import UUID

import structlog
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from doctor_who_library.application.services.library_service import LibraryService
from doctor_who_library.shared.config.container import Container
from doctor_who_library.shared.exceptions.application import ServiceException
from doctor_who_library.shared.exceptions.domain import EntityNotFoundException

logger = structlog.get_logger()


# Response models
class LibraryItemResponse(BaseModel):
    """Response model for library items."""

    id: UUID
    title: str
    display_title: str | None = None
    story_title: str | None = None
    episode_title: str | None = None
    serial_title: str | None = None
    content_type: str | None = None
    section_name: str | None = None
    group_name: str | None = None
    doctor: str | None = None
    companions: str | None = None
    writer: str | None = None
    director: str | None = None
    producer: str | None = None
    story_number: str | None = None
    series: str | None = None
    format: str | None = None
    duration: str | None = None
    broadcast_date: datetime | None = None
    release_date: datetime | None = None
    cover_date: datetime | None = None
    enrichment_status: str
    enrichment_confidence: float
    enrichment_error: str | None = None
    wiki_url: str | None = None
    wiki_summary: str | None = None
    wiki_image_url: str | None = None
    wiki_search_term: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LibraryStatsResponse(BaseModel):
    """Response model for library statistics."""

    total_items: int
    total_sections: int
    total_groups: int
    enrichment_stats: dict[str, int]
    note: str


class PaginatedLibraryResponse(BaseModel):
    """Response model for paginated library items."""

    items: list[LibraryItemResponse]
    total: int
    page: int
    size: int
    pages: int


# Create router
router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("/sections/validate/{section_name}", response_model=dict[str, Any])
@inject
async def validate_section_name(
    section_name: str,
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> dict[str, Any]:
    """Validate a section name and return validation result."""
    try:
        validated_name = await service.validate_section_name(section_name)
        return {
            "valid": True,
            "section_name": validated_name,
            "message": "Section name is valid",
        }
    except ServiceException as e:
        return {"valid": False, "section_name": section_name, "message": str(e)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/items", response_model=PaginatedLibraryResponse)
@inject
async def get_library_items(
    limit: int = Query(
        50, ge=1, description="Number of items to return (no upper limit)"
    ),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    section: str | None = Query(None, description="Filter by section"),
    group: str | None = Query(None, description="Filter by group"),
    enrichment_status: str
    | None = Query(None, description="Filter by enrichment status"),
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> PaginatedLibraryResponse:
    """Get paginated library items with optional filtering."""
    try:
        if enrichment_status:
            # Validate and convert string to enum
            from doctor_who_library.domain.value_objects.enrichment_status import (
                EnrichmentStatus,
            )

            try:
                status_enum = EnrichmentStatus(enrichment_status)
            except ValueError:
                valid_statuses = [status.value for status in EnrichmentStatus]
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid enrichment_status '{enrichment_status}'. Valid values: {valid_statuses}",
                ) from None

            items = await service.get_items_by_status(status_enum)
            total = len(items)
            items = items[offset : offset + limit]
        elif section:
            try:
                items = await service.get_items_by_section(section)
                total = len(items)
                items = items[offset : offset + limit]
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e
        elif group:
            items = await service.get_items_by_group(group)
            total = len(items)
            items = items[offset : offset + limit]
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
                logger.error(
                    f"Failed to convert item {item.id} to response format: {e}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Data conversion error for item {item.id}: {str(e)}",
                ) from e

        return PaginatedLibraryResponse(
            items=response_items,
            total=total,
            page=page,
            size=limit,
            pages=pages,
        )
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


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
    except EntityNotFoundException as e:
        raise HTTPException(status_code=404, detail="Library item not found") from e
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/search", response_model=list[LibraryItemResponse])
@inject
async def search_library_items(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, description="Maximum results (no upper limit)"),
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> list[LibraryItemResponse]:
    """Search library items by query."""
    try:
        items = await service.search_items(q, limit=limit)
        return [LibraryItemResponse.model_validate(item) for item in items]
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


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
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/sections", response_model=list[str])
@inject
async def get_library_sections(
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> list[str]:
    """Get all approved library sections."""
    try:
        # Return approved section names from the validation service
        sections = await service.get_approved_section_names()
        return sections
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/groups", response_model=list[str])
@inject
async def get_library_groups(
    service: LibraryService = Depends(Provide[Container.library_service]),
) -> list[str]:
    """Get all unique library groups."""
    try:
        # Use a direct database query to get distinct groups efficiently
        from doctor_who_library.shared.database.connection import execute_query

        rows = execute_query(
            "SELECT DISTINCT group_name FROM library_items WHERE group_name IS NOT NULL ORDER BY group_name"
        )

        groups = [row[0] for row in rows]
        return groups
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e
