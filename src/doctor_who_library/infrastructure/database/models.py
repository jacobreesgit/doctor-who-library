"""Modern SQLAlchemy database models."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import CHAR, Column, DateTime, Float, String, Text, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base: Any = declarative_base()


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PostgresUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return value
        else:
            if not isinstance(value, UUID):
                return str(value)
            else:
                # hexstring
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, UUID):
                # Handle hex string format (32 chars without dashes)
                if isinstance(value, str) and len(value) == 32:
                    # Convert from hex string to UUID format
                    formatted = f"{value[:8]}-{value[8:12]}-{value[12:16]}-{value[16:20]}-{value[20:]}"
                    return UUID(formatted)
                else:
                    return UUID(value)
            else:
                return value


class LibraryItemModel(Base):
    """Database model for library items."""

    __tablename__ = "library_items"

    # Primary key
    id = Column(
        String,
        primary_key=True,
        nullable=False,
    )

    # Core fields
    title = Column(String, nullable=False, default="")
    display_title = Column(String, nullable=True)
    story_title = Column(String, nullable=True)
    episode_title = Column(String, nullable=True)
    serial_title = Column(String, nullable=True)

    # Classification
    content_type = Column(String, nullable=True)
    section_name = Column(String, nullable=True)
    group_name = Column(String, nullable=True)

    # Personnel
    doctor = Column(String, nullable=True)
    companions = Column(String, nullable=True)
    writer = Column(String, nullable=True)
    director = Column(String, nullable=True)
    producer = Column(String, nullable=True)

    # Production details
    story_number = Column(String, nullable=True)
    series = Column(String, nullable=True)
    format = Column(String, nullable=True)
    duration = Column(String, nullable=True)

    # Dates
    broadcast_date = Column(DateTime, nullable=True)
    release_date = Column(DateTime, nullable=True)
    cover_date = Column(DateTime, nullable=True)

    # Enrichment
    enrichment_status = Column(String, nullable=False, default="pending")
    enrichment_confidence = Column(Float, nullable=True, default=0.0)
    enrichment_error = Column(Text, nullable=True)

    # Wiki data
    wiki_url = Column(String, nullable=True)
    wiki_summary = Column(Text, nullable=True)
    wiki_image_url = Column(String, nullable=True)
    wiki_search_term = Column(String, nullable=True)

    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<LibraryItemModel(id={self.id}, title='{self.title}')>"


class LibrarySectionModel(Base):
    """Database model for library sections."""

    __tablename__ = "library_sections"

    # Primary key
    id = Column(
        String,
        primary_key=True,
        nullable=False,
    )

    # Core fields
    name = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Float, nullable=True, default=0.0)

    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<LibrarySectionModel(id={self.id}, name='{self.name}')>"


class LibraryGroupModel(Base):
    """Database model for library groups."""

    __tablename__ = "library_groups"

    # Primary key
    id = Column(
        String,
        primary_key=True,
        nullable=False,
    )

    # Core fields
    name = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    section_name = Column(String, nullable=True)
    sort_order = Column(Float, nullable=True, default=0.0)

    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<LibraryGroupModel(id={self.id}, name='{self.name}')>"
