"""Application service for library operations."""

from typing import Any
from uuid import UUID

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.services.section_validation_service import (
    SectionValidationService,
)
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.shared.exceptions.application import ServiceException
from doctor_who_library.shared.exceptions.domain import EntityNotFoundException


class LibraryService:
    """Application service for library operations."""

    def __init__(self):
        self._section_validator = SectionValidationService()

    async def get_item_by_id(self, item_id: UUID) -> LibraryItem:
        """Get a library item by ID."""
        try:
            from datetime import datetime

            from doctor_who_library.shared.database.connection import execute_query

            # Remove dashes from UUID for database lookup
            hex_id = str(item_id).replace("-", "")

            rows = execute_query(
                "SELECT id, title, story_title, episode_title, serial_title, "
                "content_type, section_name, group_name, doctor, companions, writer, director, producer, "
                "story_number, series, format, duration, broadcast_date, release_date, cover_date, "
                "enrichment_status, enrichment_confidence, enrichment_error, "
                "wiki_url, wiki_summary, wiki_image_url, wiki_search_term, created_at, updated_at "
                "FROM library_items WHERE id = ?",
                (hex_id,),
            )

            if not rows:
                raise EntityNotFoundException("LibraryItem", item_id)

            row = rows[0]
            (
                hex_id,
                title,
                story_title,
                episode_title,
                serial_title,
                content_type,
                section_name,
                group_name,
                doctor,
                companions,
                writer,
                director,
                producer,
                story_number,
                series,
                format,
                duration,
                broadcast_date,
                release_date,
                cover_date,
                enrichment_status,
                enrichment_confidence,
                enrichment_error,
                wiki_url,
                wiki_summary,
                wiki_image_url,
                wiki_search_term,
                created_at,
                updated_at,
            ) = row

            # Safe enrichment status conversion
            try:
                status = (
                    EnrichmentStatus(enrichment_status)
                    if enrichment_status
                    else EnrichmentStatus.PENDING
                )
            except ValueError:
                status = EnrichmentStatus.PENDING

            # Convert date strings to datetime objects if needed
            def parse_datetime(date_str):
                if date_str:
                    try:
                        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except ValueError:
                        return None
                return None

            item = LibraryItem(
                id=item_id,
                title=title or "Unknown Title",
                display_title=title,  # Use title as display_title since it doesn't exist in DB
                story_title=story_title,
                episode_title=episode_title,
                serial_title=serial_title,
                content_type=None,  # ContentType enum handling can be added later
                section_name=section_name,
                group_name=group_name,
                doctor=doctor,
                companions=companions,
                writer=writer,
                director=director,
                producer=producer,
                story_number=story_number,
                series=series,
                format=format,
                duration=duration,
                broadcast_date=parse_datetime(broadcast_date),
                release_date=parse_datetime(release_date),
                cover_date=parse_datetime(cover_date),
                enrichment_status=status,
                enrichment_confidence=enrichment_confidence or 0.0,
                enrichment_error=enrichment_error,
                wiki_url=wiki_url,
                wiki_summary=wiki_summary,
                wiki_image_url=wiki_image_url,
                wiki_search_term=wiki_search_term,
                created_at=parse_datetime(created_at) or datetime.utcnow(),
                updated_at=parse_datetime(updated_at) or datetime.utcnow(),
            )

            return item
        except EntityNotFoundException:
            raise
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_item_by_id",
                message=f"Failed to get item by ID: {item_id}",
                cause=e,
            ) from e

    async def get_all_items(
        self, limit: int | None = None, offset: int = 0
    ) -> list[LibraryItem]:
        """Get all library items with optional pagination."""
        try:
            from datetime import datetime
            from uuid import UUID

            from doctor_who_library.domain.value_objects.enrichment_status import (
                EnrichmentStatus,
            )
            from doctor_who_library.shared.database.connection import execute_query

            # Get complete data with all fields
            rows = execute_query(
                "SELECT id, title, story_title, episode_title, serial_title, "
                "content_type, section_name, group_name, doctor, companions, writer, director, producer, "
                "story_number, series, format, duration, broadcast_date, release_date, cover_date, "
                "enrichment_status, enrichment_confidence, enrichment_error, "
                "wiki_url, wiki_summary, wiki_image_url, wiki_search_term, created_at, updated_at "
                "FROM library_items LIMIT ? OFFSET ?",
                (limit if limit is not None else 50, offset),
            )

            items = []
            for row in rows:
                (
                    hex_id,
                    title,
                    story_title,
                    episode_title,
                    serial_title,
                    content_type,
                    section_name,
                    group_name,
                    doctor,
                    companions,
                    writer,
                    director,
                    producer,
                    story_number,
                    series,
                    format,
                    duration,
                    broadcast_date,
                    release_date,
                    cover_date,
                    enrichment_status,
                    enrichment_confidence,
                    enrichment_error,
                    wiki_url,
                    wiki_summary,
                    wiki_image_url,
                    wiki_search_term,
                    created_at,
                    updated_at,
                ) = row

                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)

                # Safe enrichment status conversion
                try:
                    status = (
                        EnrichmentStatus(enrichment_status)
                        if enrichment_status
                        else EnrichmentStatus.PENDING
                    )
                except ValueError:
                    status = EnrichmentStatus.PENDING

                # Convert date strings to datetime objects if needed
                def parse_datetime(date_str):
                    if date_str:
                        try:
                            return datetime.fromisoformat(
                                date_str.replace("Z", "+00:00")
                            )
                        except ValueError:
                            return None
                    return None

                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    display_title=title,  # Use title as display_title since it doesn't exist in DB
                    story_title=story_title,
                    episode_title=episode_title,
                    serial_title=serial_title,
                    content_type=None,  # ContentType enum handling can be added later
                    section_name=section_name,
                    group_name=group_name,
                    doctor=doctor,
                    companions=companions,
                    writer=writer,
                    director=director,
                    producer=producer,
                    story_number=story_number,
                    series=series,
                    format=format,
                    duration=duration,
                    broadcast_date=parse_datetime(broadcast_date),
                    release_date=parse_datetime(release_date),
                    cover_date=parse_datetime(cover_date),
                    enrichment_status=status,
                    enrichment_confidence=enrichment_confidence or 0.0,
                    enrichment_error=enrichment_error,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    wiki_image_url=wiki_image_url,
                    wiki_search_term=wiki_search_term,
                    created_at=parse_datetime(created_at) or datetime.utcnow(),
                    updated_at=parse_datetime(updated_at) or datetime.utcnow(),
                )
                items.append(item)

            return items

        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_all_items",
                message="Failed to get all library items",
                cause=e,
            ) from e

    async def search_items(
        self, query: str, limit: int | None = None
    ) -> list[LibraryItem]:
        """Search library items by query."""
        try:
            # TODO: Implement search functionality with direct database queries
            # For now, return empty list
            return []
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="search_items",
                message=f"Failed to search items: {query}",
                cause=e,
            ) from e

    async def get_items_by_section(self, section_name: str) -> list[LibraryItem]:
        """Get items by section name."""
        try:
            # Validate section name first
            validated_section = self._section_validator.validate_section_name(
                section_name
            )

            from datetime import datetime
            from uuid import UUID

            from doctor_who_library.shared.database.connection import execute_query

            # Get complete data filtered by section
            rows = execute_query(
                "SELECT id, title, story_title, episode_title, serial_title, "
                "content_type, section_name, group_name, doctor, companions, writer, director, producer, "
                "story_number, series, format, duration, broadcast_date, release_date, cover_date, "
                "enrichment_status, enrichment_confidence, enrichment_error, "
                "wiki_url, wiki_summary, wiki_image_url, wiki_search_term, created_at, updated_at "
                "FROM library_items WHERE section_name = ?",
                (validated_section,),
            )

            items = []
            for row in rows:
                (
                    hex_id,
                    title,
                    story_title,
                    episode_title,
                    serial_title,
                    content_type,
                    section_name,
                    group_name,
                    doctor,
                    companions,
                    writer,
                    director,
                    producer,
                    story_number,
                    series,
                    format,
                    duration,
                    broadcast_date,
                    release_date,
                    cover_date,
                    enrichment_status,
                    enrichment_confidence,
                    enrichment_error,
                    wiki_url,
                    wiki_summary,
                    wiki_image_url,
                    wiki_search_term,
                    created_at,
                    updated_at,
                ) = row

                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)

                # Safe enrichment status conversion
                try:
                    status = (
                        EnrichmentStatus(enrichment_status)
                        if enrichment_status
                        else EnrichmentStatus.PENDING
                    )
                except ValueError:
                    status = EnrichmentStatus.PENDING

                # Convert date strings to datetime objects if needed
                def parse_datetime(date_str):
                    if date_str:
                        try:
                            return datetime.fromisoformat(
                                date_str.replace("Z", "+00:00")
                            )
                        except ValueError:
                            return None
                    return None

                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    display_title=title,  # Use title as display_title since it doesn't exist in DB
                    story_title=story_title,
                    episode_title=episode_title,
                    serial_title=serial_title,
                    content_type=None,  # ContentType enum handling can be added later
                    section_name=section_name,
                    group_name=group_name,
                    doctor=doctor,
                    companions=companions,
                    writer=writer,
                    director=director,
                    producer=producer,
                    story_number=story_number,
                    series=series,
                    format=format,
                    duration=duration,
                    broadcast_date=parse_datetime(broadcast_date),
                    release_date=parse_datetime(release_date),
                    cover_date=parse_datetime(cover_date),
                    enrichment_status=status,
                    enrichment_confidence=enrichment_confidence or 0.0,
                    enrichment_error=enrichment_error,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    wiki_image_url=wiki_image_url,
                    wiki_search_term=wiki_search_term,
                    created_at=parse_datetime(created_at) or datetime.utcnow(),
                    updated_at=parse_datetime(updated_at) or datetime.utcnow(),
                )
                items.append(item)

            return items
        except ValueError as e:
            # Section validation error
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_section",
                message=str(e),
                cause=e,
            ) from e
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_section",
                message=f"Failed to get items by section: {section_name}",
                cause=e,
            ) from e

    async def get_items_by_group(self, group_name: str) -> list[LibraryItem]:
        """Get items by group name."""
        try:
            # TODO: Implement group filtering with direct database queries
            # For now, return empty list
            return []
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_group",
                message=f"Failed to get items by group: {group_name}",
                cause=e,
            ) from e

    async def get_items_by_status(self, status: EnrichmentStatus) -> list[LibraryItem]:
        """Get items by enrichment status."""
        try:
            from datetime import datetime
            from uuid import UUID

            from doctor_who_library.shared.database.connection import execute_query

            # Get complete data filtered by status
            rows = execute_query(
                "SELECT id, title, story_title, episode_title, serial_title, "
                "content_type, section_name, group_name, doctor, companions, writer, director, producer, "
                "story_number, series, format, duration, broadcast_date, release_date, cover_date, "
                "enrichment_status, enrichment_confidence, enrichment_error, "
                "wiki_url, wiki_summary, wiki_image_url, wiki_search_term, created_at, updated_at "
                "FROM library_items WHERE enrichment_status = ?",
                (status.value,),
            )

            items = []
            for row in rows:
                (
                    hex_id,
                    title,
                    story_title,
                    episode_title,
                    serial_title,
                    content_type,
                    section_name,
                    group_name,
                    doctor,
                    companions,
                    writer,
                    director,
                    producer,
                    story_number,
                    series,
                    format,
                    duration,
                    broadcast_date,
                    release_date,
                    cover_date,
                    enrichment_status,
                    enrichment_confidence,
                    enrichment_error,
                    wiki_url,
                    wiki_summary,
                    wiki_image_url,
                    wiki_search_term,
                    created_at,
                    updated_at,
                ) = row

                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)

                # Convert date strings to datetime objects if needed
                def parse_datetime(date_str):
                    if date_str:
                        try:
                            return datetime.fromisoformat(
                                date_str.replace("Z", "+00:00")
                            )
                        except ValueError:
                            return None
                    return None

                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    display_title=title,  # Use title as display_title since it doesn't exist in DB
                    story_title=story_title,
                    episode_title=episode_title,
                    serial_title=serial_title,
                    content_type=None,  # ContentType enum handling can be added later
                    section_name=section_name,
                    group_name=group_name,
                    doctor=doctor,
                    companions=companions,
                    writer=writer,
                    director=director,
                    producer=producer,
                    story_number=story_number,
                    series=series,
                    format=format,
                    duration=duration,
                    broadcast_date=parse_datetime(broadcast_date),
                    release_date=parse_datetime(release_date),
                    cover_date=parse_datetime(cover_date),
                    enrichment_status=status,  # Use the input status directly
                    enrichment_confidence=enrichment_confidence or 0.0,
                    enrichment_error=enrichment_error,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    wiki_image_url=wiki_image_url,
                    wiki_search_term=wiki_search_term,
                    created_at=parse_datetime(created_at) or datetime.utcnow(),
                    updated_at=parse_datetime(updated_at) or datetime.utcnow(),
                )
                items.append(item)

            return items
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_status",
                message=f"Failed to get items by status: {status}",
                cause=e,
            ) from e

    async def get_total_count(self) -> int:
        """Get total count of library items."""
        try:
            from doctor_who_library.shared.database.connection import execute_query

            total_result = execute_query("SELECT COUNT(*) FROM library_items")
            return total_result[0][0]
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_total_count",
                message="Failed to get total count",
                cause=e,
            ) from e

    # CRUD operations removed - not needed for current functionality

    async def get_library_stats(self) -> dict[str, Any]:
        """Get library statistics."""
        try:
            from doctor_who_library.domain.value_objects.enrichment_status import (
                EnrichmentStatus,
            )
            from doctor_who_library.shared.database.connection import execute_query

            # Get total count
            total_result = execute_query("SELECT COUNT(*) FROM library_items")
            total_count = total_result[0][0]

            # Get enrichment stats
            enrichment_stats = {}
            for status in EnrichmentStatus:
                count_result = execute_query(
                    "SELECT COUNT(*) FROM library_items WHERE enrichment_status = ?",
                    (status.value,),
                )
                enrichment_stats[status.value] = count_result[0][0]

            stats = {
                "total_items": total_count,
                "total_sections": 0,  # Placeholder
                "total_groups": 0,  # Placeholder
                "enrichment_stats": enrichment_stats,
                "note": f"Doctor Who Library contains {total_count} items",
            }

            return stats
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_library_stats",
                message="Failed to get library statistics",
                cause=e,
            ) from e

    async def get_approved_section_names(self) -> list[str]:
        """Get all approved section names."""
        try:
            return self._section_validator.get_all_approved_section_names()
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_approved_section_names",
                message="Failed to get approved section names",
                cause=e,
            ) from e

    async def validate_section_name(self, section_name: str) -> str:
        """Validate a section name."""
        try:
            return self._section_validator.validate_section_name(section_name)
        except ValueError as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="validate_section_name",
                message=str(e),
                cause=e,
            ) from e
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="validate_section_name",
                message=f"Failed to validate section name: {section_name}",
                cause=e,
            ) from e
