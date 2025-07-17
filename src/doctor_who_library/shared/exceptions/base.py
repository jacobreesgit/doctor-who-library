"""Base exception classes."""

from typing import Optional, Any, Dict


class DoctorWhoLibraryException(Exception):
    """Base exception for all Doctor Who Library errors."""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.cause = cause
    
    def __str__(self) -> str:
        return self.message
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(message='{self.message}', error_code='{self.error_code}')"