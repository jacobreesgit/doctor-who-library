"""Domain-specific exceptions."""

from typing import Any
from uuid import UUID

from .base import DoctorWhoLibraryException


class DomainException(DoctorWhoLibraryException):
    """Base exception for domain-related errors."""

    pass


class EntityNotFoundException(DomainException):
    """Exception raised when an entity is not found."""

    def __init__(
        self,
        entity_type: str,
        entity_id: UUID | None = None,
        search_criteria: dict[str, Any] | None = None,
    ):
        if entity_id:
            message = f"{entity_type} with ID {entity_id} not found"
        elif search_criteria:
            criteria_str = ", ".join(f"{k}={v}" for k, v in search_criteria.items())
            message = f"{entity_type} with criteria {criteria_str} not found"
        else:
            message = f"{entity_type} not found"

        super().__init__(
            message=message,
            error_code="ENTITY_NOT_FOUND",
            details={
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
                "search_criteria": search_criteria,
            },
        )


class ValidationException(DomainException):
    """Exception raised when validation fails."""

    def __init__(
        self,
        field_name: str,
        field_value: Any,
        validation_rule: str,
        details: dict[str, Any] | None = None,
    ):
        message = f"Validation failed for field '{field_name}': {validation_rule}"

        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={
                "field_name": field_name,
                "field_value": field_value,
                "validation_rule": validation_rule,
                **(details or {}),
            },
        )
