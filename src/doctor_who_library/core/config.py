"""Configuration management using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = Field(default="Doctor Who Library", description="Application name")
    version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # Database
    database_url: str = Field(
        default="sqlite:///./doctor_who_library.db",
        description="Database connection URL"
    )
    database_echo: bool = Field(default=False, description="Enable SQL query logging")
    
    # API
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    api_cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="CORS allowed origins"
    )
    
    # TARDIS Wiki Configuration
    wiki_base_url: str = Field(
        default="https://tardis.wiki/wiki/",
        description="TARDIS Wiki base URL"
    )
    wiki_api_url: str = Field(
        default="https://tardis.wiki/api.php",
        description="TARDIS Wiki API URL"
    )
    wiki_user_agent: str = Field(
        default="DoctorWhoLibrary/1.0 (https://github.com/doctor-who-library)",
        description="User agent for wiki requests"
    )
    wiki_request_delay: float = Field(
        default=1.0,
        description="Delay between wiki requests (seconds)"
    )
    wiki_timeout: int = Field(default=30, description="Request timeout (seconds)")
    wiki_max_retries: int = Field(default=3, description="Maximum retry attempts")
    
    # Background Jobs
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis URL")
    celery_broker_url: str = Field(default="redis://localhost:6379/0", description="Celery broker URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/0", description="Celery result backend")
    
    # Data Paths
    data_dir: Path = Field(default=Path("data"), description="Data directory path")
    
    # Enrichment
    enrichment_batch_size: int = Field(default=10, description="Items per enrichment batch")
    enrichment_confidence_threshold: float = Field(
        default=0.7,
        description="Minimum confidence score for enrichment"
    )
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format string"
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()