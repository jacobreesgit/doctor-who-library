"""Database models for Doctor Who Library."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class LibraryItem(Base):
    """Library item representing a Doctor Who story/episode."""
    
    __tablename__ = "library_items"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core Story Information
    title = Column(String(500), nullable=False, index=True)
    story_title = Column(String(500), index=True)
    episode_title = Column(String(500), index=True)
    serial_title = Column(String(500), index=True)
    
    # Content Classification
    content_type = Column(String(100), index=True)  # TV, Audio, Comic, etc.
    section_name = Column(String(100), index=True)  # Doctor era
    group_name = Column(String(200), index=True)    # Story arc/series
    
    # Temporal Information
    broadcast_date = Column(DateTime)
    release_date = Column(DateTime)
    cover_date = Column(DateTime)
    
    # Personnel
    doctor = Column(String(100), index=True)
    companions = Column(Text)
    writer = Column(String(500))
    director = Column(String(500))
    producer = Column(String(500))
    
    # Production Details
    story_number = Column(String(50))
    series = Column(String(100))
    format = Column(String(100))
    duration = Column(String(50))
    
    # Installment Information
    number_of_instalments = Column(Integer)
    installment_number = Column(Integer)
    total_installments = Column(Integer)
    
    # Content Details
    setting = Column(Text)
    featuring = Column(Text)
    main_character = Column(Text)
    main_enemy = Column(Text)
    
    # Enrichment Data
    wiki_url = Column(String(500))
    wiki_summary = Column(Text)
    wiki_image_url = Column(String(500))
    cast_info = Column(Text)  # JSON string
    
    # Enrichment Status
    enrichment_status = Column(
        String(20), 
        default="pending", 
        index=True
    )  # pending, enriched, failed, skipped
    enrichment_confidence = Column(Float, default=0.0)
    enrichment_error = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<LibraryItem(title='{self.title}', content_type='{self.content_type}')>"
    
    @property
    def display_title(self) -> str:
        """Get the best available title for display."""
        return (
            self.serial_title or
            self.episode_title or
            self.story_title or
            self.title or
            "Untitled"
        )
    
    @property
    def primary_date(self) -> Optional[datetime]:
        """Get the primary date for sorting/display."""
        return (
            self.broadcast_date or
            self.release_date or
            self.cover_date
        )


# EnrichmentJob removed - enrichment is now developer-only via CLI


class LibrarySection(Base):
    """Organizational section for library items (e.g., Doctor eras)."""
    
    __tablename__ = "library_sections"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Section Details
    name = Column(String(100), nullable=False, unique=True, index=True)
    display_name = Column(String(200))
    description = Column(Text)
    
    # Ordering and Visibility
    sort_order = Column(Integer, default=0)
    visible = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<LibrarySection(name='{self.name}')>"


class LibraryGroup(Base):
    """Organizational group within sections (e.g., story arcs, series)."""
    
    __tablename__ = "library_groups"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Group Details
    name = Column(String(200), nullable=False, index=True)
    section_name = Column(String(100), nullable=False, index=True)
    
    # Ordering
    sort_order = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<LibraryGroup(name='{self.name}', section='{self.section_name}')>"