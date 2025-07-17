"""API routes for development and debugging operations.

This module provides endpoints specifically designed for development monitoring
and debugging of the Doctor Who Library enrichment system. These endpoints
allow developers to:

1. Monitor recent enrichment activity
2. Get enrichment statistics and summaries
3. Debug enrichment issues by viewing recent results

These endpoints are not intended for production frontend consumption but rather
for development tools, monitoring dashboards, and debugging workflows.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from dependency_injector.wiring import inject, Provide
from pydantic import BaseModel, Field

from doctor_who_library.application.services.enrichment_service import EnrichmentService
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.shared.config.container import Container
from doctor_who_library.shared.exceptions.application import ServiceException
import structlog

logger = structlog.get_logger()


# Response models
class RecentEnrichmentItem(BaseModel):
    """Response model for individual recent enrichment items."""
    
    id: UUID
    title: str
    story_title: Optional[str] = None
    episode_title: Optional[str] = None
    section_name: Optional[str] = None
    enrichment_status: str
    enrichment_confidence: float
    enrichment_error: Optional[str] = None
    wiki_url: Optional[str] = None
    wiki_summary: Optional[str] = None
    wiki_search_term: Optional[str] = None
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class RecentEnrichmentResponse(BaseModel):
    """Response model for recent enrichments endpoint."""
    
    recent_enrichments: List[RecentEnrichmentItem]
    total_count: int
    since: Optional[datetime] = None
    hours: Optional[int] = None


# Create router
router = APIRouter(prefix="/api/dev", tags=["development"])


@router.get("/recent-enrichments", response_model=RecentEnrichmentResponse)
@inject
async def get_recent_enrichments(
    limit: int = Query(20, ge=1, description="Number of recent enrichments to return (no upper limit)"),
    hours: Optional[int] = Query(None, ge=1, le=168, description="Number of hours to look back for recent enrichments"),
    since: Optional[datetime] = Query(None, description="Get enrichments since this timestamp (ISO format)"),
    status: Optional[str] = Query(None, description="Filter by enrichment status (enriched, failed, skipped)"),
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> RecentEnrichmentResponse:
    """Get recently enriched library items for development monitoring."""
    try:
        from doctor_who_library.shared.database.connection import execute_query
        from uuid import UUID
        
        # Build query to get recent enrichments
        query = """
            SELECT id, title, story_title, episode_title, section_name, enrichment_status, 
                   enrichment_confidence, enrichment_error, wiki_url, wiki_summary, 
                   wiki_search_term, updated_at
            FROM library_items 
            WHERE enrichment_status != 'pending'
        """
        
        query_params = []
        
        # Add time filter (priority: since > hours > default 24h)
        if since:
            query += " AND updated_at >= ?"
            query_params.append(since.isoformat())
        elif hours:
            query += " AND updated_at >= datetime('now', '-{} hours')".format(hours)
        else:
            query += " AND updated_at >= datetime('now', '-24 hours')"
        
        # Add status filter if provided
        if status:
            # Validate status
            try:
                status_enum = EnrichmentStatus(status)
                query += " AND enrichment_status = ?"
                query_params.append(status)
            except ValueError:
                valid_statuses = [s.value for s in EnrichmentStatus if s != EnrichmentStatus.PENDING]
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status '{status}'. Valid values: {valid_statuses}"
                )
        
        # Order by most recent first and limit
        query += " ORDER BY updated_at DESC LIMIT ?"
        query_params.append(limit)
        
        rows = execute_query(query, query_params)
        
        # Convert rows to response objects
        recent_items = []
        for row in rows:
            hex_id, title, story_title, episode_title, section_name, enrichment_status, \
            enrichment_confidence, enrichment_error, wiki_url, wiki_summary, \
            wiki_search_term, updated_at = row
            
            # Convert hex ID to UUID
            try:
                if len(hex_id) == 32:
                    # Handle hex string format (32 chars without dashes)
                    formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                    uuid_id = UUID(formatted_id)
                else:
                    # Handle UUID string format
                    uuid_id = UUID(hex_id)
            except ValueError:
                logger.error(f"Invalid UUID format: {hex_id}")
                continue
            
            # Parse updated_at timestamp
            try:
                if isinstance(updated_at, str):
                    # SQLite datetime format
                    updated_at_dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                else:
                    updated_at_dt = updated_at
            except (ValueError, TypeError):
                logger.error(f"Invalid datetime format: {updated_at}")
                updated_at_dt = datetime.utcnow()
            
            recent_item = RecentEnrichmentItem(
                id=uuid_id,
                title=title or "Unknown Title",
                story_title=story_title,
                episode_title=episode_title,
                section_name=section_name,
                enrichment_status=enrichment_status,
                enrichment_confidence=enrichment_confidence or 0.0,
                enrichment_error=enrichment_error,
                wiki_url=wiki_url,
                wiki_summary=wiki_summary,
                wiki_search_term=wiki_search_term,
                updated_at=updated_at_dt,
            )
            recent_items.append(recent_item)
        
        logger.info(f"Retrieved {len(recent_items)} recent enrichments")
        return RecentEnrichmentResponse(
            recent_enrichments=recent_items,
            total_count=len(recent_items),
            since=since,
            hours=hours,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recent enrichments: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent enrichments")


@router.get("/enrichment-summary", response_model=Dict[str, Any])
@inject
async def get_enrichment_summary(
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back for summary"),
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> Dict[str, Any]:
    """Get enrichment activity summary for development monitoring."""
    try:
        from doctor_who_library.shared.database.connection import execute_query
        
        # Get counts by status for recent period
        query = """
            SELECT enrichment_status, COUNT(*) as count
            FROM library_items 
            WHERE enrichment_status != 'pending'
            AND updated_at >= datetime('now', '-{} hours')
            GROUP BY enrichment_status
        """.format(hours)
        
        rows = execute_query(query)
        
        # Build summary
        summary = {
            "time_period_hours": hours,
            "recent_activity": {},
            "total_recent": 0,
        }
        
        for row in rows:
            status, count = row
            summary["recent_activity"][status] = count
            summary["total_recent"] += count
        
        # Get overall stats using direct database query
        overall_query = """
            SELECT enrichment_status, COUNT(*) as count
            FROM library_items 
            GROUP BY enrichment_status
        """
        overall_rows = execute_query(overall_query)
        
        overall_stats = {}
        for row in overall_rows:
            status, count = row
            overall_stats[status] = count
        
        # Calculate average confidence for enriched items
        avg_query = """
            SELECT AVG(enrichment_confidence) 
            FROM library_items 
            WHERE enrichment_status = 'enriched' 
            AND enrichment_confidence IS NOT NULL
        """
        avg_rows = execute_query(avg_query)
        overall_stats["avg_confidence"] = avg_rows[0][0] if avg_rows and avg_rows[0][0] else 0.0
        
        summary["overall_stats"] = overall_stats
        
        # Calculate recent activity percentage
        if summary["total_recent"] > 0 and overall_stats.get("enriched", 0) > 0:
            summary["recent_enriched_percentage"] = (
                summary["recent_activity"].get("enriched", 0) / overall_stats["enriched"] * 100
            )
        else:
            summary["recent_enriched_percentage"] = 0.0
        
        logger.info(f"Generated enrichment summary for {hours} hours")
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get enrichment summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve enrichment summary")