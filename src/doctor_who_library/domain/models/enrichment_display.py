"""Unified enrichment display data model for optimal user experience."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class EnrichmentActivityType(str, Enum):
    """Types of enrichment activity for display purposes."""

    ENRICHED = "enriched"
    FAILED = "failed"
    SKIPPED = "skipped"
    RESET = "reset"
    PENDING = "pending"


class EnrichmentDisplayItem(BaseModel):
    """Unified enrichment display model with all necessary information."""

    # Core identification
    id: UUID
    title: str
    story_title: str | None = None
    episode_title: str | None = None
    section_name: str | None = None
    group_name: str | None = None

    # Current enrichment state
    enrichment_status: EnrichmentActivityType
    enrichment_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    enrichment_error: str | None = None

    # Wiki enrichment data
    wiki_url: str | None = None
    wiki_summary: str | None = None
    wiki_image_url: str | None = None
    wiki_search_term: str | None = None

    # Timeline information
    created_at: datetime
    updated_at: datetime

    # Display metadata
    is_recent: bool = Field(default=False, description="Processed in current session")
    activity_age_hours: float = Field(
        default=0.0, description="Hours since last activity"
    )

    # Quality indicators
    confidence_level: str = Field(
        default="low", description="Human-readable confidence level"
    )
    has_wiki_data: bool = Field(
        default=False, description="Whether wiki data was retrieved"
    )

    model_config = {"from_attributes": True}

    def __post_init__(self) -> None:
        """Calculate derived fields after initialization."""
        # Calculate confidence level
        if self.enrichment_confidence >= 0.8:
            self.confidence_level = "high"
        elif self.enrichment_confidence >= 0.6:
            self.confidence_level = "medium"
        else:
            self.confidence_level = "low"

        # Calculate activity age
        now = datetime.utcnow()
        age_delta = now - self.updated_at
        self.activity_age_hours = age_delta.total_seconds() / 3600

        # Check if has wiki data
        self.has_wiki_data = bool(
            self.wiki_url or self.wiki_summary or self.wiki_image_url
        )


class EnrichmentDisplayResponse(BaseModel):
    """Unified response model for enrichment display."""

    items: list[EnrichmentDisplayItem]
    total_count: int
    cursor: str | None = None  # For cursor-based pagination
    has_more: bool = Field(default=False)

    # Statistics
    stats: dict[str, Any] = Field(default_factory=dict)

    # Filter context
    filters: dict[str, Any] = Field(default_factory=dict)

    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    response_time_ms: float | None = None


class EnrichmentDisplayRequest(BaseModel):
    """Request model for enrichment display queries."""

    # Pagination
    limit: int | None = Field(
        default=None, ge=1, description="Items per page (no limit if None)"
    )
    cursor: str | None = Field(default=None, description="Cursor for pagination")

    # Filtering
    status: list[EnrichmentActivityType] | None = Field(
        default=None, description="Filter by status"
    )
    section: list[str] | None = Field(default=None, description="Filter by section")
    confidence_min: float | None = Field(default=None, ge=0.0, le=1.0)
    confidence_max: float | None = Field(default=None, ge=0.0, le=1.0)

    # Time filtering
    since: datetime | None = Field(
        default=None, description="Items updated since this time"
    )
    hours_back: int | None = Field(
        default=None, ge=1, le=8760, description="Hours to look back"
    )

    # Sorting
    sort_by: str = Field(default="updated_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")

    # Display options
    include_stats: bool = Field(
        default=True, description="Include statistics in response"
    )
    include_pending: bool = Field(default=False, description="Include pending items")
    mark_recent: bool = Field(
        default=True, description="Mark items as recent based on activity"
    )
    recent_hours: int = Field(
        default=2, ge=1, le=24, description="Hours to consider as recent"
    )


class EnrichmentStats(BaseModel):
    """Enrichment statistics for display."""

    # Overall counts
    total_items: int
    pending_count: int
    enriched_count: int
    failed_count: int
    skipped_count: int

    # Quality metrics
    avg_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    high_confidence_count: int = Field(
        default=0, description="Items with confidence >= 0.8"
    )
    medium_confidence_count: int = Field(
        default=0, description="Items with confidence >= 0.6"
    )
    low_confidence_count: int = Field(
        default=0, description="Items with confidence < 0.6"
    )

    # Progress metrics
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    success_rate: float = Field(default=0.0, ge=0.0, le=100.0)

    # Recent activity (configurable time window)
    recent_activity_hours: int = Field(default=24)
    recent_enriched: int = Field(default=0)
    recent_failed: int = Field(default=0)
    recent_skipped: int = Field(default=0)

    # Wiki data coverage
    items_with_wiki_data: int = Field(default=0)
    wiki_coverage_percentage: float = Field(default=0.0, ge=0.0, le=100.0)

    # Performance metrics
    avg_processing_time: float | None = Field(
        default=None, description="Average processing time in seconds"
    )

    model_config = {"from_attributes": True}


class EnrichmentProgressUpdate(BaseModel):
    """Real-time progress update model."""

    # Update type
    update_type: str = Field(
        description="Type of update (item_processed, batch_complete, etc.)"
    )

    # Item information
    item_id: UUID | None = None
    item_title: str | None = None

    # Processing result
    status: EnrichmentActivityType | None = None
    confidence: float | None = None
    error: str | None = None

    # Progress information
    items_processed: int = Field(default=0)
    items_remaining: int = Field(default=0)
    current_batch: int = Field(default=0)
    total_batches: int = Field(default=0)

    # Performance metrics
    processing_time: float | None = Field(
        default=None, description="Processing time for this item"
    )
    estimated_time_remaining: float | None = Field(
        default=None, description="Estimated time remaining in seconds"
    )

    # Timestamp
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}
