"""Modern configuration system with environment-specific settings."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    url: str = Field(
        default="sqlite+aiosqlite:///doctor_who_library.db",
        description="Database connection URL",
    )
    echo: bool = Field(
        default=False,
        description="Echo SQL statements to console",
    )
    pool_size: int = Field(
        default=5,
        description="Database connection pool size",
    )
    max_overflow: int = Field(
        default=10,
        description="Maximum overflow connections",
    )

    model_config = {"env_prefix": "DATABASE_"}


class WikiSettings(BaseSettings):
    """Wiki service configuration settings."""

    base_url: str = Field(
        default="https://tardis.fandom.com/wiki/",
        description="Base URL for TARDIS Wiki",
    )
    api_url: str = Field(
        default="https://tardis.fandom.com/api.php",
        description="API URL for TARDIS Wiki",
    )
    user_agent: str = Field(
        default="Doctor Who Library/1.0 (https://github.com/example/doctor-who-library)",
        description="User agent for wiki requests",
    )
    timeout: int = Field(
        default=30,
        description="Request timeout in seconds",
    )
    request_delay: float = Field(
        default=1.0,
        description="Delay between requests in seconds",
    )
    max_retries: int = Field(
        default=3,
        description="Maximum number of retries for failed requests",
    )
    confidence_threshold: float = Field(
        default=0.7,
        description="Minimum confidence threshold for enrichment",
    )

    @field_validator("confidence_threshold")
    def validate_confidence_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Confidence threshold must be between 0.0 and 1.0")
        return v

    model_config = {"env_prefix": "WIKI_"}


class APISettings(BaseSettings):
    """API configuration settings."""

    host: str = Field(
        default="127.0.0.1",
        description="API server host",
    )
    port: int = Field(
        default=8000,
        description="API server port",
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode",
    )
    cors_origins: list[str] = Field(
        default=["*"],
        description="CORS allowed origins",
    )
    docs_url: str | None = Field(
        default="/docs",
        description="API documentation URL",
    )
    redoc_url: str | None = Field(
        default="/redoc",
        description="ReDoc documentation URL",
    )

    model_config = {"env_prefix": "API_"}


class LoggingSettings(BaseSettings):
    """Logging configuration settings."""

    level: str = Field(
        default="INFO",
        description="Logging level",
    )
    format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log message format",
    )
    file_path: Path | None = Field(
        default=None,
        description="Log file path",
    )
    max_file_size: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum log file size in bytes",
    )
    backup_count: int = Field(
        default=5,
        description="Number of backup log files to keep",
    )
    structured: bool = Field(
        default=True,
        description="Use structured logging",
    )

    @field_validator("level")
    def validate_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Log level must be one of {valid_levels}")
        return v.upper()

    model_config = {"env_prefix": "LOG_"}


class EnrichmentSettings(BaseSettings):
    """Enrichment configuration settings."""

    batch_size: int = Field(
        default=10,
        description="Number of items to process in each batch",
    )
    max_concurrent: int = Field(
        default=5,
        description="Maximum concurrent enrichment operations",
    )
    retry_failed: bool = Field(
        default=True,
        description="Retry failed enrichments",
    )
    retry_delay: float = Field(
        default=60.0,
        description="Delay before retrying failed enrichments in seconds",
    )

    model_config = {"env_prefix": "ENRICHMENT_"}


class Settings(BaseSettings):
    """Main application settings."""

    # Environment
    environment: str = Field(
        default="development",
        description="Application environment",
    )

    # Component settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    wiki: WikiSettings = Field(default_factory=WikiSettings)
    api: APISettings = Field(default_factory=APISettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    enrichment: EnrichmentSettings = Field(default_factory=EnrichmentSettings)

    # Application info
    app_name: str = Field(
        default="Doctor Who Library",
        description="Application name",
    )
    app_version: str = Field(
        default="1.0.0",
        description="Application version",
    )

    @field_validator("environment")
    def validate_environment(cls, v):
        valid_environments = ["development", "testing", "staging", "production"]
        if v.lower() not in valid_environments:
            raise ValueError(f"Environment must be one of {valid_environments}")
        return v.lower()

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    def is_development(self) -> bool:
        return self.environment == "development"

    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
