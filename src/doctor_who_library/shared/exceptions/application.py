"""Application-specific exceptions."""

from typing import Optional, Any, Dict

from .base import DoctorWhoLibraryException


class ApplicationException(DoctorWhoLibraryException):
    """Base exception for application-related errors."""
    pass


class ServiceException(ApplicationException):
    """Exception raised for service-related errors."""
    
    def __init__(
        self,
        service_name: str,
        operation: str,
        message: str,
        cause: Optional[Exception] = None,
    ):
        super().__init__(
            message=f"{service_name} service error during {operation}: {message}",
            error_code="SERVICE_ERROR",
            details={
                "service_name": service_name,
                "operation": operation,
            },
            cause=cause,
        )