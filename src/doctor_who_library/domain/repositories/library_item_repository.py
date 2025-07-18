"""Repository interface for library items."""

from abc import ABC, abstractmethod
from uuid import UUID

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus


class LibraryItemRepository(ABC):
    """Abstract repository for library items."""

    @abstractmethod
    async def get_by_id(self, item_id: UUID) -> LibraryItem | None:
        """Get a library item by its ID."""
        pass

    @abstractmethod
    async def get_all(
        self, limit: int | None = None, offset: int = 0
    ) -> list[LibraryItem]:
        """Get all library items with optional pagination."""
        pass

    @abstractmethod
    async def get_by_status(
        self, status: EnrichmentStatus, limit: int | None = None
    ) -> list[LibraryItem]:
        """Get library items by enrichment status."""
        pass

    @abstractmethod
    async def search(self, query: str, limit: int | None = None) -> list[LibraryItem]:
        """Search library items by title or content."""
        pass

    @abstractmethod
    async def get_by_section(self, section_name: str) -> list[LibraryItem]:
        """Get library items by section name."""
        pass

    @abstractmethod
    async def get_by_group(self, group_name: str) -> list[LibraryItem]:
        """Get library items by group name."""
        pass

    @abstractmethod
    async def save(self, item: LibraryItem) -> LibraryItem:
        """Save a library item."""
        pass

    @abstractmethod
    async def save_many(self, items: list[LibraryItem]) -> list[LibraryItem]:
        """Save multiple library items."""
        pass

    @abstractmethod
    async def delete(self, item_id: UUID) -> None:
        """Delete a library item."""
        pass

    @abstractmethod
    async def delete_all(self) -> None:
        """Delete all library items."""
        pass

    @abstractmethod
    async def count(self) -> int:
        """Get total count of library items."""
        pass

    @abstractmethod
    async def count_by_status(self, status: EnrichmentStatus) -> int:
        """Get count of items by enrichment status."""
        pass
