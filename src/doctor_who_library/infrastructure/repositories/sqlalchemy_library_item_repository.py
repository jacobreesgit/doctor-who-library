"""SQLAlchemy implementation of library item repository."""

from collections.abc import Callable
from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.repositories.library_item_repository import (
    LibraryItemRepository,
)
from doctor_who_library.domain.value_objects.content_type import ContentType
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.infrastructure.database.models import LibraryItemModel
from doctor_who_library.shared.exceptions.domain import EntityNotFoundException
from doctor_who_library.shared.exceptions.infrastructure import DatabaseException


class SQLAlchemyLibraryItemRepository(LibraryItemRepository):
    """SQLAlchemy implementation of library item repository."""

    def __init__(self, session_factory: Callable[[], AsyncSession]):
        self._session_factory = session_factory

    async def get_by_id(self, item_id: UUID) -> LibraryItem | None:
        """Get a library item by its ID."""
        try:
            async with self._session_factory() as session:
                stmt = select(LibraryItemModel).where(LibraryItemModel.id == item_id)
                result = await session.execute(stmt)
                model = result.scalar_one_or_none()

                if model is None:
                    return None

                return self._model_to_entity(model)
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to get library item by ID: {item_id}",
                operation="get_by_id",
                table="library_items",
                cause=e,
            ) from e

    async def get_all(
        self, limit: int | None = None, offset: int = 0
    ) -> list[LibraryItem]:
        """Get all library items with optional pagination."""
        try:
            async with self._session_factory() as session:
                stmt = select(LibraryItemModel).offset(offset)
                if limit:
                    stmt = stmt.limit(limit)

                result = await session.execute(stmt)
                models = result.scalars().all()

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message="Failed to get all library items",
                operation="get_all",
                table="library_items",
                cause=e,
            ) from e

    async def get_by_status(
        self, status: EnrichmentStatus, limit: int | None = None
    ) -> list[LibraryItem]:
        """Get library items by enrichment status."""
        try:
            async with self._session_factory() as session:
                stmt = select(LibraryItemModel).where(
                    LibraryItemModel.enrichment_status == status.value
                )
                if limit:
                    stmt = stmt.limit(limit)

                result = await session.execute(stmt)
                models = result.scalars().all()

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to get library items by status: {status}",
                operation="get_by_status",
                table="library_items",
                cause=e,
            ) from e

    async def search(self, query: str, limit: int | None = None) -> list[LibraryItem]:
        """Search library items by title or content."""
        try:
            async with self._session_factory() as session:
                search_term = f"%{query}%"
                stmt = select(LibraryItemModel).where(
                    or_(
                        LibraryItemModel.title.ilike(search_term),
                        LibraryItemModel.display_title.ilike(search_term),
                        LibraryItemModel.story_title.ilike(search_term),
                        LibraryItemModel.episode_title.ilike(search_term),
                        LibraryItemModel.serial_title.ilike(search_term),
                        LibraryItemModel.wiki_summary.ilike(search_term),
                    )
                )
                if limit:
                    stmt = stmt.limit(limit)

                result = await session.execute(stmt)
                models = result.scalars().all()

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to search library items: {query}",
                operation="search",
                table="library_items",
                cause=e,
            ) from e

    async def get_by_section(self, section_name: str) -> list[LibraryItem]:
        """Get library items by section name."""
        try:
            async with self._session_factory() as session:
                stmt = select(LibraryItemModel).where(
                    LibraryItemModel.section_name == section_name
                )

                result = await session.execute(stmt)
                models = result.scalars().all()

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to get library items by section: {section_name}",
                operation="get_by_section",
                table="library_items",
                cause=e,
            ) from e

    async def get_by_group(self, group_name: str) -> list[LibraryItem]:
        """Get library items by group name."""
        try:
            async with self._session_factory() as session:
                stmt = select(LibraryItemModel).where(
                    LibraryItemModel.group_name == group_name
                )

                result = await session.execute(stmt)
                models = result.scalars().all()

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to get library items by group: {group_name}",
                operation="get_by_group",
                table="library_items",
                cause=e,
            ) from e

    async def save(self, item: LibraryItem) -> LibraryItem:
        """Save a library item."""
        try:
            async with self._session_factory() as session:
                model = self._entity_to_model(item)

                # Check if item exists
                existing_stmt = select(LibraryItemModel).where(
                    LibraryItemModel.id == item.id
                )
                existing_result = await session.execute(existing_stmt)
                existing_model = existing_result.scalar_one_or_none()

                if existing_model:
                    # Update existing
                    await session.merge(model)
                else:
                    # Create new
                    session.add(model)

                await session.commit()
                await session.refresh(model)

                return self._model_to_entity(model)
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to save library item: {item.id}",
                operation="save",
                table="library_items",
                cause=e,
            ) from e

    async def save_many(self, items: list[LibraryItem]) -> list[LibraryItem]:
        """Save multiple library items."""
        try:
            async with self._session_factory() as session:
                models = [self._entity_to_model(item) for item in items]

                # Use bulk operations for better performance
                for model in models:
                    await session.merge(model)

                await session.commit()

                # Refresh models to get updated data
                for model in models:
                    await session.refresh(model)

                return [self._model_to_entity(model) for model in models]
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to save {len(items)} library items",
                operation="save_many",
                table="library_items",
                cause=e,
            ) from e

    async def delete(self, item_id: UUID) -> None:
        """Delete a library item."""
        try:
            async with self._session_factory() as session:
                stmt = delete(LibraryItemModel).where(LibraryItemModel.id == item_id)
                result = await session.execute(stmt)

                if result.rowcount == 0:
                    raise EntityNotFoundException("LibraryItem", item_id)

                await session.commit()
        except EntityNotFoundException:
            raise
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to delete library item: {item_id}",
                operation="delete",
                table="library_items",
                cause=e,
            ) from e

    async def delete_all(self) -> None:
        """Delete all library items."""
        try:
            async with self._session_factory() as session:
                stmt = delete(LibraryItemModel)
                await session.execute(stmt)
                await session.commit()
        except Exception as e:
            raise DatabaseException(
                message="Failed to delete all library items",
                operation="delete_all",
                table="library_items",
                cause=e,
            ) from e

    async def count(self) -> int:
        """Get total count of library items."""
        try:
            async with self._session_factory() as session:
                stmt = select(func.count(LibraryItemModel.id))
                result = await session.execute(stmt)
                return result.scalar() or 0
        except Exception as e:
            raise DatabaseException(
                message="Failed to count library items",
                operation="count",
                table="library_items",
                cause=e,
            ) from e

    async def count_by_status(self, status: EnrichmentStatus) -> int:
        """Get count of items by enrichment status."""
        try:
            async with self._session_factory() as session:
                stmt = select(func.count(LibraryItemModel.id)).where(
                    LibraryItemModel.enrichment_status == status.value
                )
                result = await session.execute(stmt)
                return result.scalar() or 0
        except Exception as e:
            raise DatabaseException(
                message=f"Failed to count library items by status: {status}",
                operation="count_by_status",
                table="library_items",
                cause=e,
            ) from e

    def _model_to_entity(self, model: LibraryItemModel) -> LibraryItem:
        """Convert database model to domain entity."""
        try:
            from datetime import datetime
            from uuid import UUID

            # Handle UUID conversion
            try:
                if isinstance(model.id, str):
                    if len(model.id) == 32:
                        # Convert hex string to UUID format
                        formatted_id = f"{model.id[:8]}-{model.id[8:12]}-{model.id[12:16]}-{model.id[16:20]}-{model.id[20:]}"
                        entity_id = UUID(formatted_id)
                    else:
                        entity_id = UUID(model.id)
                else:
                    entity_id = model.id
            except Exception as e:
                print(f"UUID conversion error: {e}, using random UUID")
                entity_id = UUID("00000000-0000-0000-0000-000000000000")

            return LibraryItem(
                id=entity_id,
                title=str(model.title) if model.title is not None else "",
                display_title=str(model.display_title)
                if model.display_title is not None
                else None,
                story_title=str(model.story_title)
                if model.story_title is not None
                else None,
                episode_title=str(model.episode_title)
                if model.episode_title is not None
                else None,
                serial_title=str(model.serial_title)
                if model.serial_title is not None
                else None,
                content_type=self._safe_content_type(
                    str(model.content_type) if model.content_type is not None else ""
                ),
                section_name=str(model.section_name)
                if model.section_name is not None
                else None,
                group_name=str(model.group_name)
                if model.group_name is not None
                else None,
                doctor=model.doctor,
                companions=model.companions,
                writer=model.writer,
                director=model.director,
                producer=model.producer,
                story_number=model.story_number,
                series=model.series,
                format=model.format,
                duration=model.duration,
                broadcast_date=model.broadcast_date,
                release_date=model.release_date,
                cover_date=model.cover_date,
                enrichment_status=self._safe_enrichment_status(model.enrichment_status),
                enrichment_confidence=model.enrichment_confidence or 0.0,
                enrichment_error=model.enrichment_error,
                wiki_url=model.wiki_url,
                wiki_summary=model.wiki_summary,
                wiki_image_url=model.wiki_image_url,
                wiki_search_term=model.wiki_search_term,
                created_at=model.created_at
                if hasattr(model.created_at, "replace")
                else datetime.utcnow(),
                updated_at=model.updated_at
                if hasattr(model.updated_at, "replace")
                else datetime.utcnow(),
            )
        except Exception as e:
            print(f"Error converting model to entity: {e}")
            print(f"Model ID: {model.id}, Title: {model.title}")
            raise

    def _safe_enrichment_status(self, status_str: str) -> EnrichmentStatus:
        """Safely convert string to EnrichmentStatus enum."""
        try:
            if not status_str:
                return EnrichmentStatus.PENDING
            return EnrichmentStatus(status_str.lower())
        except ValueError:
            # Log the problematic value and default to PENDING
            print(
                f"WARNING: Unknown enrichment status '{status_str}', defaulting to PENDING"
            )
            return EnrichmentStatus.PENDING

    def _safe_content_type(self, content_type_str: str) -> ContentType | None:
        """Safely convert string to ContentType enum."""
        if not content_type_str:
            return None

        # First try exact match
        try:
            return ContentType(content_type_str)
        except ValueError:
            pass

        # Create mapping for common mismatches
        content_type_mapping = {
            "Big Finish Productions": ContentType.BIG_FINISH,
            "BBC Audio": ContentType.BBC_AUDIO,
            "BBC Television": ContentType.BBC_TELEVISION,
            "TV": ContentType.TV,
            "Documentary": ContentType.DOCUMENTARY,
            "BBC 7 / Big Finish Productions": ContentType.BBC_AUDIO_BIG_FINISH,
            "BBC Audio / Big Finish Productions": ContentType.BBC_AUDIO_BIG_FINISH,
            "BBC Minisode": ContentType.BBC_MINISODE,
            "BBC Minisode (Trailer)": ContentType.BBC_MINISODE_TRAILER,
            "Disney Television": ContentType.DISNEY_TELEVISION,
            "BBC Adventure Games": ContentType.BBC_ADVENTURE_GAMES,
            "Doctor Who Magazine Comic": ContentType.DWM_COMIC,
            "BBC Books": ContentType.BBC_BOOKS,
            "BBCi Webcast": ContentType.BBCI_WEBCAST,
        }

        # Try mapped value
        if content_type_str in content_type_mapping:
            return content_type_mapping[content_type_str]

        # For unrecognized types, return None (will be displayed as empty in frontend)
        return None

    def _entity_to_model(self, entity: LibraryItem) -> LibraryItemModel:
        """Convert domain entity to database model."""
        return LibraryItemModel(
            id=entity.id,
            title=entity.title,
            display_title=entity.display_title,
            story_title=entity.story_title,
            episode_title=entity.episode_title,
            serial_title=entity.serial_title,
            content_type=entity.content_type.value if entity.content_type else None,
            section_name=entity.section_name,
            group_name=entity.group_name,
            doctor=entity.doctor,
            companions=entity.companions,
            writer=entity.writer,
            director=entity.director,
            producer=entity.producer,
            story_number=entity.story_number,
            series=entity.series,
            format=entity.format,
            duration=entity.duration,
            broadcast_date=entity.broadcast_date,
            release_date=entity.release_date,
            cover_date=entity.cover_date,
            enrichment_status=entity.enrichment_status.value,
            enrichment_confidence=entity.enrichment_confidence,
            enrichment_error=entity.enrichment_error,
            wiki_url=entity.wiki_url,
            wiki_summary=entity.wiki_summary,
            wiki_image_url=entity.wiki_image_url,
            wiki_search_term=entity.wiki_search_term,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
