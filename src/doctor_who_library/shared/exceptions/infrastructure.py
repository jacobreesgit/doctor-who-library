"""Infrastructure-specific exceptions."""


from .base import DoctorWhoLibraryException


class InfrastructureException(DoctorWhoLibraryException):
    """Base exception for infrastructure-related errors."""

    pass


class DatabaseException(InfrastructureException):
    """Exception raised for database-related errors."""

    def __init__(
        self,
        message: str,
        operation: str | None = None,
        table: str | None = None,
        cause: Exception | None = None,
    ):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details={
                "operation": operation,
                "table": table,
            },
            cause=cause,
        )


class ExternalServiceException(InfrastructureException):
    """Exception raised for external service errors."""

    def __init__(
        self,
        service_name: str,
        operation: str,
        message: str,
        status_code: int | None = None,
        response_body: str | None = None,
        cause: Exception | None = None,
    ):
        super().__init__(
            message=f"{service_name} service error during {operation}: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={
                "service_name": service_name,
                "operation": operation,
                "status_code": status_code,
                "response_body": response_body,
            },
            cause=cause,
        )
