"""Unified enrichment display API endpoints.

This module provides optimized endpoints for enrichment display and monitoring
without artificial limits. Designed for optimal user experience with:

1. Single unified endpoint for all enrichment data
2. Efficient cursor-based pagination
3. Real-time Server-Sent Events for monitoring
4. No arbitrary limits - show what the user needs
5. Comprehensive filtering and sorting options
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from dependency_injector.wiring import inject, Provide
import asyncio
import json
from contextlib import asynccontextmanager

from doctor_who_library.application.services.enrichment_service import EnrichmentService
from doctor_who_library.domain.models.enrichment_display import (
    EnrichmentDisplayItem,
    EnrichmentDisplayResponse,
    EnrichmentDisplayRequest,
    EnrichmentStats,
    EnrichmentProgressUpdate,
    EnrichmentActivityType,
)
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.shared.config.container import Container
from doctor_who_library.shared.exceptions.application import ServiceException
from doctor_who_library.shared.database.connection import execute_query
import structlog

logger = structlog.get_logger()

# Create router
router = APIRouter(prefix="/api/enrichment", tags=["enrichment-display"])


@router.post("/display", response_model=EnrichmentDisplayResponse)
@inject
async def get_enrichment_display(
    request: EnrichmentDisplayRequest,
    service: EnrichmentService = Depends(Provide[Container.enrichment_service]),
) -> EnrichmentDisplayResponse:
    """Unified enrichment display endpoint with comprehensive filtering and no artificial limits."""
    
    start_time = datetime.utcnow()
    
    try:
        # Build dynamic query based on request parameters
        query_parts = []
        query_params = []
        
        # Base query
        base_query = """
            SELECT id, title, story_title, episode_title, section_name, group_name,
                   enrichment_status, enrichment_confidence, enrichment_error,
                   wiki_url, wiki_summary, wiki_image_url, wiki_search_term,
                   created_at, updated_at
            FROM library_items
        """
        
        # Build WHERE clauses
        where_clauses = []
        
        # Status filtering
        if request.status:
            status_placeholders = ",".join("?" * len(request.status))
            where_clauses.append(f"enrichment_status IN ({status_placeholders})")
            query_params.extend([s.value for s in request.status])
        elif not request.include_pending:
            # Default: exclude pending unless explicitly requested
            where_clauses.append("enrichment_status != 'pending'")
        
        # Section filtering
        if request.section:
            section_placeholders = ",".join("?" * len(request.section))
            where_clauses.append(f"section_name IN ({section_placeholders})")
            query_params.extend(request.section)
        
        # Confidence filtering
        if request.confidence_min is not None:
            where_clauses.append("enrichment_confidence >= ?")
            query_params.append(request.confidence_min)
        
        if request.confidence_max is not None:
            where_clauses.append("enrichment_confidence <= ?")
            query_params.append(request.confidence_max)
        
        # Time filtering
        if request.since:
            where_clauses.append("updated_at >= ?")
            query_params.append(request.since.isoformat())
        elif request.hours_back:
            where_clauses.append(f"updated_at >= datetime('now', '-{request.hours_back} hours')")
        
        # Cursor-based pagination
        if request.cursor:
            try:
                cursor_data = json.loads(request.cursor)
                cursor_timestamp = cursor_data.get("timestamp")
                cursor_id = cursor_data.get("id")
                
                if cursor_timestamp and cursor_id:
                    if request.sort_order == "desc":
                        where_clauses.append("(updated_at < ? OR (updated_at = ? AND id < ?))")
                        query_params.extend([cursor_timestamp, cursor_timestamp, cursor_id])
                    else:
                        where_clauses.append("(updated_at > ? OR (updated_at = ? AND id > ?))")
                        query_params.extend([cursor_timestamp, cursor_timestamp, cursor_id])
            except (json.JSONDecodeError, KeyError):
                raise HTTPException(status_code=400, detail="Invalid cursor format")
        
        # Combine WHERE clauses
        if where_clauses:
            query_parts.append("WHERE " + " AND ".join(where_clauses))
        
        # Add sorting
        sort_direction = "DESC" if request.sort_order.lower() == "desc" else "ASC"
        query_parts.append(f"ORDER BY {request.sort_by} {sort_direction}, id {sort_direction}")
        
        # Add limit for pagination (add 1 to check if there are more results)
        if request.limit:
            query_parts.append("LIMIT ?")
            query_params.append(request.limit + 1)
        
        # Execute query
        full_query = base_query + " " + " ".join(query_parts)
        rows = execute_query(full_query, query_params)
        
        # Process results
        items = []
        has_more = False
        
        if request.limit and len(rows) > request.limit:
            has_more = True
            rows = rows[:-1]  # Remove the extra row
        
        # Recent activity threshold
        recent_threshold = datetime.utcnow() - timedelta(hours=request.recent_hours)
        
        for row in rows:
            hex_id, title, story_title, episode_title, section_name, group_name, \
            enrichment_status, enrichment_confidence, enrichment_error, \
            wiki_url, wiki_summary, wiki_image_url, wiki_search_term, \
            created_at, updated_at = row
            
            # Convert hex ID to UUID
            try:
                if len(hex_id) == 32:
                    formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                    uuid_id = UUID(formatted_id)
                else:
                    uuid_id = UUID(hex_id)
            except ValueError:
                logger.error(f"Invalid UUID format: {hex_id}")
                continue
            
            # Parse timestamps
            try:
                if isinstance(created_at, str):
                    created_at_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                else:
                    created_at_dt = created_at
                
                if isinstance(updated_at, str):
                    updated_at_dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                else:
                    updated_at_dt = updated_at
            except (ValueError, TypeError):
                logger.error(f"Invalid datetime format: {created_at}, {updated_at}")
                created_at_dt = datetime.utcnow()
                updated_at_dt = datetime.utcnow()
            
            # Create display item
            item = EnrichmentDisplayItem(
                id=uuid_id,
                title=title or "Unknown Title",
                story_title=story_title,
                episode_title=episode_title,
                section_name=section_name,
                group_name=group_name,
                enrichment_status=EnrichmentActivityType(enrichment_status),
                enrichment_confidence=enrichment_confidence or 0.0,
                enrichment_error=enrichment_error,
                wiki_url=wiki_url,
                wiki_summary=wiki_summary,
                wiki_image_url=wiki_image_url,
                wiki_search_term=wiki_search_term,
                created_at=created_at_dt,
                updated_at=updated_at_dt,
                is_recent=request.mark_recent and updated_at_dt > recent_threshold,
            )
            
            # Calculate derived fields
            item.__post_init__()
            items.append(item)
        
        # Generate next cursor if there are more results
        next_cursor = None
        if has_more and items:
            last_item = items[-1]
            cursor_data = {
                "timestamp": last_item.updated_at.isoformat(),
                "id": str(last_item.id),
            }
            next_cursor = json.dumps(cursor_data)
        
        # Get statistics if requested
        stats = {}
        if request.include_stats:
            stats = await get_enrichment_stats(request.recent_hours)
        
        # Calculate response time
        end_time = datetime.utcnow()
        response_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Build response
        response = EnrichmentDisplayResponse(
            items=items,
            total_count=len(items),
            cursor=next_cursor,
            has_more=has_more,
            stats=stats,
            filters={
                "status": [s.value for s in request.status] if request.status else None,
                "section": request.section,
                "confidence_range": [request.confidence_min, request.confidence_max],
                "time_filter": {
                    "since": request.since.isoformat() if request.since else None,
                    "hours_back": request.hours_back,
                },
                "include_pending": request.include_pending,
            },
            generated_at=end_time,
            response_time_ms=response_time_ms,
        )
        
        # Removed verbose logging for cleaner output
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get enrichment display: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve enrichment display")


async def get_enrichment_stats(recent_hours: int = 24) -> Dict[str, Any]:
    """Get comprehensive enrichment statistics."""
    
    try:
        # Overall counts
        overall_query = """
            SELECT enrichment_status, COUNT(*) as count
            FROM library_items 
            GROUP BY enrichment_status
        """
        overall_rows = execute_query(overall_query)
        
        counts = {
            "total_items": 0,
            "pending_count": 0,
            "enriched_count": 0,
            "failed_count": 0,
            "skipped_count": 0,
        }
        
        for row in overall_rows:
            status, count = row
            counts["total_items"] += count
            if status == "pending":
                counts["pending_count"] = count
            elif status == "enriched":
                counts["enriched_count"] = count
            elif status == "failed":
                counts["failed_count"] = count
            elif status == "skipped":
                counts["skipped_count"] = count
        
        # Quality metrics
        quality_query = """
            SELECT 
                AVG(enrichment_confidence) as avg_confidence,
                COUNT(CASE WHEN enrichment_confidence >= 0.8 THEN 1 END) as high_confidence,
                COUNT(CASE WHEN enrichment_confidence >= 0.6 AND enrichment_confidence < 0.8 THEN 1 END) as medium_confidence,
                COUNT(CASE WHEN enrichment_confidence < 0.6 THEN 1 END) as low_confidence
            FROM library_items 
            WHERE enrichment_status = 'enriched' 
            AND enrichment_confidence IS NOT NULL
        """
        quality_rows = execute_query(quality_query)
        
        quality_stats = {
            "avg_confidence": 0.0,
            "high_confidence_count": 0,
            "medium_confidence_count": 0,
            "low_confidence_count": 0,
        }
        
        if quality_rows and quality_rows[0][0] is not None:
            avg_conf, high_conf, med_conf, low_conf = quality_rows[0]
            quality_stats.update({
                "avg_confidence": float(avg_conf or 0.0),
                "high_confidence_count": int(high_conf or 0),
                "medium_confidence_count": int(med_conf or 0),
                "low_confidence_count": int(low_conf or 0),
            })
        
        # Recent activity
        recent_query = f"""
            SELECT enrichment_status, COUNT(*) as count
            FROM library_items 
            WHERE enrichment_status != 'pending'
            AND updated_at >= datetime('now', '-{recent_hours} hours')
            GROUP BY enrichment_status
        """
        recent_rows = execute_query(recent_query)
        
        recent_stats = {
            "recent_activity_hours": recent_hours,
            "recent_enriched": 0,
            "recent_failed": 0,
            "recent_skipped": 0,
        }
        
        for row in recent_rows:
            status, count = row
            if status == "enriched":
                recent_stats["recent_enriched"] = count
            elif status == "failed":
                recent_stats["recent_failed"] = count
            elif status == "skipped":
                recent_stats["recent_skipped"] = count
        
        # Wiki coverage
        wiki_query = """
            SELECT COUNT(*) as count
            FROM library_items 
            WHERE enrichment_status = 'enriched'
            AND (wiki_url IS NOT NULL OR wiki_summary IS NOT NULL OR wiki_image_url IS NOT NULL)
        """
        wiki_rows = execute_query(wiki_query)
        wiki_coverage = int(wiki_rows[0][0] or 0) if wiki_rows else 0
        
        # Progress calculations
        processed_count = counts["enriched_count"] + counts["failed_count"] + counts["skipped_count"]
        completion_percentage = (processed_count / counts["total_items"] * 100) if counts["total_items"] > 0 else 0.0
        success_rate = (counts["enriched_count"] / processed_count * 100) if processed_count > 0 else 0.0
        wiki_coverage_percentage = (wiki_coverage / counts["enriched_count"] * 100) if counts["enriched_count"] > 0 else 0.0
        
        # Combine all stats
        stats = EnrichmentStats(
            **counts,
            **quality_stats,
            **recent_stats,
            completion_percentage=completion_percentage,
            success_rate=success_rate,
            items_with_wiki_data=wiki_coverage,
            wiki_coverage_percentage=wiki_coverage_percentage,
        )
        
        return stats.model_dump()
        
    except Exception as e:
        logger.error(f"Failed to get enrichment stats: {e}")
        return {}


@router.get("/stats", response_model=EnrichmentStats)
async def get_enrichment_stats_endpoint(
    recent_hours: int = Query(24, ge=1, le=168, description="Hours for recent activity calculation"),
) -> EnrichmentStats:
    """Get comprehensive enrichment statistics."""
    
    stats_data = await get_enrichment_stats(recent_hours)
    return EnrichmentStats(**stats_data)


@router.get("/stream")
async def stream_enrichment_progress(
    request: Request,
    include_pending: bool = Query(False, description="Include pending items in stream"),
    recent_hours: int = Query(2, ge=1, le=24, description="Hours to consider as recent"),
) -> StreamingResponse:
    """Server-Sent Events stream for real-time enrichment monitoring."""
    
    async def event_stream():
        """Generate Server-Sent Events for real-time updates."""
        
        last_check = datetime.utcnow()
        
        while True:
            try:
                # Check if client is still connected
                if await request.is_disconnected():
                    break
                
                # Get recent changes since last check (with a small buffer to catch timing issues)
                check_time = last_check - timedelta(seconds=5)  # 5 second buffer
                display_request = EnrichmentDisplayRequest(
                    since=check_time,
                    include_pending=include_pending,
                    include_stats=True,
                    mark_recent=True,
                    recent_hours=recent_hours,
                    sort_by="updated_at",
                    sort_order="desc",
                )
                
                response = await get_enrichment_display(display_request)
                
                # Send update if there are changes
                if response.items:
                    update_data = {
                        "type": "items_updated",
                        "items": [item.model_dump() for item in response.items],
                        "stats": response.stats,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    
                    yield f"data: {json.dumps(update_data)}\n\n"
                
                # Send periodic heartbeat
                heartbeat_data = {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                    "stats": response.stats,
                }
                
                yield f"data: {json.dumps(heartbeat_data)}\n\n"
                
                # Update last check time
                last_check = datetime.utcnow()
                
                # Wait before next check (shorter interval for better responsiveness)
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error in enrichment stream: {e}")
                error_data = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                break
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/recent")
async def get_recent_enrichments(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    status: Optional[List[str]] = Query(None, description="Filter by status"),
    section: Optional[List[str]] = Query(None, description="Filter by section"),
) -> EnrichmentDisplayResponse:
    """Get recent enrichment activity with flexible filtering."""
    
    # Convert status strings to enum
    status_enums = None
    if status:
        try:
            status_enums = [EnrichmentActivityType(s) for s in status]
        except ValueError as e:
            valid_statuses = [s.value for s in EnrichmentActivityType]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Valid values: {valid_statuses}"
            )
    
    request = EnrichmentDisplayRequest(
        hours_back=hours,
        status=status_enums,
        section=section,
        include_stats=True,
        mark_recent=True,
        recent_hours=hours,
        sort_by="updated_at",
        sort_order="desc",
    )
    
    return await get_enrichment_display(request)


@router.get("/all")
async def get_all_enrichments(
    include_pending: bool = Query(False, description="Include pending items"),
    limit: Optional[int] = Query(None, ge=1, description="Limit results (no limit if not specified)"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
) -> EnrichmentDisplayResponse:
    """Get all enrichment data without artificial limits."""
    
    request = EnrichmentDisplayRequest(
        limit=limit,
        cursor=cursor,
        include_pending=include_pending,
        include_stats=True,
        mark_recent=True,
        sort_by="updated_at",
        sort_order="desc",
    )
    
    return await get_enrichment_display(request)