"""Domain service interface for wiki operations."""

from abc import ABC, abstractmethod
from typing import Any

from doctor_who_library.domain.entities.library_item import LibraryItem


class WikiSearchResult:
    """Result of a wiki search operation."""

    def __init__(
        self,
        title: str,
        url: str,
        summary: str,
        confidence: float,
        search_term: str,
        image_url: str | None = None,
    ):
        self.title = title
        self.url = url
        self.summary = summary
        self.confidence = confidence
        self.search_term = search_term
        self.image_url = image_url


class WikiService(ABC):
    """Abstract service for wiki operations."""

    async def __aenter__(self) -> "WikiService":
        """Async context manager entry."""
        return self

    @abstractmethod
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        pass

    @abstractmethod
    async def search_for_item(self, item: LibraryItem) -> WikiSearchResult | None:
        """Search for wiki content for a library item."""
        pass

    @abstractmethod
    async def enrich_item(self, item: LibraryItem) -> LibraryItem:
        """Enrich a library item with wiki data."""
        pass

    @abstractmethod
    async def enrich_items(self, items: list[LibraryItem]) -> list[LibraryItem]:
        """Enrich multiple library items with wiki data."""
        pass
