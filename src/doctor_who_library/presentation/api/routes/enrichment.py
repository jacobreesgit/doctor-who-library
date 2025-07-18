"""API routes for enrichment operations."""

from typing import Any
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from doctor_who_library.application.services.enrichment_service import EnrichmentService
from doctor_who_library.shared.config.container import Container
from doctor_who_library.shared.exceptions.application import ServiceException


# Response models
class EnrichmentStatsResponse(BaseModel):
    """Response model for enrichment statistics."""

    pending: int
    enriched: int
    failed: int
    skipped: int
    avg_confidence: float


class EnrichmentResultResponse(BaseModel):
    """Response model for enrichment results."""

    processed: int
    enriched: int
    failed: int
    skipped: int
    avg_confidence: float


class EnrichmentResetResponse(BaseModel):
    """Response model for enrichment reset."""

    items_reset: int
    message: str


# Create router
router = APIRouter(prefix="/api/enrichment", tags=["enrichment"])


@router.get("/stats", response_model=EnrichmentStatsResponse)
@inject
async def get_enrichment_stats(
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> EnrichmentStatsResponse:
    """Get enrichment statistics."""
    try:
        stats = await service.get_enrichment_stats()
        return EnrichmentStatsResponse(**stats)
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/run", response_model=EnrichmentResultResponse)
@inject
async def run_enrichment(
    batch_size: int | None = Query(None, ge=1, le=100, description="Batch size"),
    max_items: int
    | None = Query(None, ge=1, le=10000, description="Maximum items to process"),
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> EnrichmentResultResponse:
    """Run enrichment on pending items."""
    try:
        result = await service.enrich_pending_items(
            batch_size=batch_size,
            max_items=max_items,
        )
        return EnrichmentResultResponse(**result)
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/items/{item_id}/enrich")
@inject
async def enrich_single_item(
    item_id: UUID,
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> dict[str, Any]:
    """Enrich a single library item."""
    try:
        item = await service.enrich_single_item(str(item_id))
        return {
            "id": str(item.id),
            "title": item.title,
            "enrichment_status": item.enrichment_status.value,
            "enrichment_confidence": item.enrichment_confidence,
            "wiki_url": item.wiki_url,
            "message": f"Item enriched with status: {item.enrichment_status.value}",
        }
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/reset", response_model=EnrichmentResetResponse)
@inject
async def reset_enrichment(
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> EnrichmentResetResponse:
    """Reset enrichment status for all items."""
    try:
        items_reset = await service.reset_enrichment_status()
        return EnrichmentResetResponse(
            items_reset=items_reset,
            message=f"Reset enrichment status for {items_reset} items",
        )
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/items/{item_id}/reset", response_model=EnrichmentResetResponse)
@inject
async def reset_item_enrichment(
    item_id: UUID,
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> EnrichmentResetResponse:
    """Reset enrichment status for a single item."""
    try:
        affected_rows = await service.reset_single_item_enrichment(str(item_id))
        if affected_rows == 0:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")

        return EnrichmentResetResponse(
            items_reset=affected_rows,
            message=f"Reset enrichment status for item {item_id}",
        )
    except ServiceException as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error") from e
