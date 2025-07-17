"""Repository interface for library items."""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus


class LibraryItemRepository(ABC):
    """Abstract repository for library items."""
    
    @abstractmethod
    async def get_by_id(self, item_id: UUID) -> Optional[LibraryItem]:
        """Get a library item by its ID."""
        pass
    
    @abstractmethod
    async def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[LibraryItem]:
        """Get all library items with optional pagination."""
        pass
    
    @abstractmethod
    async def get_by_status(self, status: EnrichmentStatus, limit: Optional[int] = None) -> List[LibraryItem]:
        """Get library items by enrichment status."""
        pass
    
    @abstractmethod
    async def search(self, query: str, limit: Optional[int] = None) -> List[LibraryItem]:
        """Search library items by title or content."""
        pass
    
    @abstractmethod
    async def get_by_section(self, section_name: str) -> List[LibraryItem]:
        """Get library items by section name."""
        pass
    
    @abstractmethod
    async def get_by_group(self, group_name: str) -> List[LibraryItem]:
        """Get library items by group name."""
        pass
    
    @abstractmethod
    async def save(self, item: LibraryItem) -> LibraryItem:
        """Save a library item."""
        pass
    
    @abstractmethod
    async def save_many(self, items: List[LibraryItem]) -> List[LibraryItem]:
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