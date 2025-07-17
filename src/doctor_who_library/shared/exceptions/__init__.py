"""Custom exceptions for the Doctor Who Library."""

from .base import DoctorWhoLibraryException
from .domain import DomainException, EntityNotFoundException, ValidationException
from .infrastructure import InfrastructureException, DatabaseException, ExternalServiceException
from .application import ApplicationException, ServiceException

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