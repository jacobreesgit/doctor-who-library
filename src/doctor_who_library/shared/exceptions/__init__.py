"""Custom exceptions for the Doctor Who Library."""

from .application import ApplicationException, ServiceException
from .base import DoctorWhoLibraryException
from .domain import DomainException, EntityNotFoundException, ValidationException
from .infrastructure import (
    DatabaseException,
    ExternalServiceException,
    InfrastructureException,
)

__all__ = [
    "DoctorWhoLibraryException",
    "DomainException",
    "EntityNotFoundException",
    "ValidationException",
    "InfrastructureException",
    "DatabaseException",
    "ExternalServiceException",
    "ApplicationException",
    "ServiceException",
]
