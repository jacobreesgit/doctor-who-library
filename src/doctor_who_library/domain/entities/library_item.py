"""Domain entity for library items."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.domain.value_objects.content_type import ContentType


@dataclass
class LibraryItem:
    """Domain entity representing a Doctor Who library item."""
    
    # Identity
    id: UUID = field(default_factory=uuid4)
    
    # Core fields
    title: str = ""
    display_title: Optional[str] = None
    story_title: Optional[str] = None
    episode_title: Optional[str] = None
    serial_title: Optional[str] = None
    
    # Classification
    content_type: Optional[ContentType] = None
    section_name: Optional[str] = None
    group_name: Optional[str] = None
    
    # Personnel
    doctor: Optional[str] = None
    companions: Optional[str] = None
    writer: Optional[str] = None
    director: Optional[str] = None
    producer: Optional[str] = None
    
    # Production details
    story_number: Optional[str] = None
    series: Optional[str] = None
    format: Optional[str] = None
    duration: Optional[str] = None
    
    # Dates
    broadcast_date: Optional[datetime] = None
    release_date: Optional[datetime] = None
    cover_date: Optional[datetime] = None
    
    # Enrichment
    enrichment_status: EnrichmentStatus = EnrichmentStatus.PENDING
    enrichment_confidence: float = 0.0
    enrichment_error: Optional[str] = None
    
    # Wiki data
    wiki_url: Optional[str] = None
    wiki_summary: Optional[str] = None
    wiki_image_url: Optional[str] = None
    wiki_search_term: Optional[str] = None
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        """Post-initialization processing."""
        if self.display_title is None:
            self.display_title = self.title
    
    def can_be_enriched(self) -> bool:
        """Check if this item can be enriched with wiki data."""
        return self.enrichment_status == EnrichmentStatus.PENDING
    
    def mark_enriched(self, confidence: float, wiki_url: str, summary: str, search_term: str) -> None:
        """Mark the item as successfully enriched."""
        self.enrichment_status = EnrichmentStatus.ENRICHED
        self.enrichment_confidence = confidence
        self.enrichment_error = None
        self.wiki_url = wiki_url
        self.wiki_summary = summary
        self.wiki_search_term = search_term
        self.updated_at = datetime.utcnow()
    
    def mark_enrichment_failed(self, error: str, search_term: Optional[str] = None) -> None:
        """Mark the item as failed enrichment."""
        self.enrichment_status = EnrichmentStatus.FAILED
        self.enrichment_error = error
        if search_term:
            self.wiki_search_term = search_term
        self.updated_at = datetime.utcnow()
    
    def mark_enrichment_skipped(self, reason: str, search_term: Optional[str] = None) -> None:
        """Mark the item as skipped during enrichment."""
        self.enrichment_status = EnrichmentStatus.SKIPPED
        self.enrichment_error = reason
        if search_term:
            self.wiki_search_term = search_term
        self.updated_at = datetime.utcnow()
    
    def reset_enrichment(self) -> None:
        """Reset enrichment status back to pending."""
        self.enrichment_status = EnrichmentStatus.PENDING
        self.enrichment_confidence = 0.0
        self.enrichment_error = None
        self.wiki_url = None
        self.wiki_summary = None
        self.wiki_image_url = None
        self.wiki_search_term = None
        self.updated_at = datetime.utcnow()
    
    def get_search_titles(self) -> list[str]:
        """Get prioritized list of titles for searching."""
        titles = []
        
        # Priority 1: Story title (for multi-part stories)
        if self.story_title and self.story_title != self.title:
            titles.append(self.story_title)
        
        # Priority 2: Serial title (alternative grouping)
        if self.serial_title and self.serial_title != self.title and self.serial_title != self.story_title:
            titles.append(self.serial_title)
        
        # Priority 3: Individual episode title
        if self.title:
            titles.append(self.title)
        
        return titles