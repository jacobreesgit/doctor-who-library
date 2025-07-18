"""Value object for enrichment status."""

from enum import Enum


class EnrichmentStatus(str, Enum):
    """Enumeration of possible enrichment statuses."""

    PENDING = "pending"
    ENRICHED = "enriched"
    FAILED = "failed"
    SKIPPED = "skipped"

    def __str__(self) -> str:
        return self.value
