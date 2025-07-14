"""Main application entry point."""

import uvicorn
from doctor_who_library.api.app import app
from doctor_who_library.core.config import get_settings
from doctor_who_library.database import create_tables

settings = get_settings()


def serve():
    """Start the FastAPI server."""
    # Create database tables
    create_tables()
    
    # Start the server
    uvicorn.run(
        "doctor_who_library.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )


if __name__ == "__main__":
    serve()