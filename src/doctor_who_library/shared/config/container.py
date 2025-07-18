"""Dependency injection container."""

from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from doctor_who_library.application.services.enrichment_service import EnrichmentService
from doctor_who_library.application.services.library_service import LibraryService
from doctor_who_library.infrastructure.external.tardis_wiki_service import (
    TardisWikiService,
)
from doctor_who_library.shared.config.settings import get_settings


class Container(containers.DeclarativeContainer):
    """Dependency injection container."""

    # Configuration
    config = providers.Singleton(get_settings)

    # Database
    database_engine = providers.Singleton(
        create_async_engine,
        url=config.provided.database.url,
        echo=config.provided.database.echo,
    )

    database_session_factory = providers.Factory(
        sessionmaker,
        bind=database_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # External Services
    wiki_service = providers.Factory(
        TardisWikiService,
        config=config.provided.wiki,
    )

    # Application Services
    library_service = providers.Factory(
        LibraryService,
    )

    enrichment_service = providers.Factory(
        EnrichmentService,
        wiki_service=wiki_service,
        config=config.provided.enrichment,
    )


# Global container instance
container = Container()


def get_container() -> Container:
    """Get the dependency injection container."""
    return container


def wire_container() -> None:
    """Wire the container for dependency injection."""
    container.wire(
        modules=[
            "doctor_who_library.presentation.api.routes.library",
            "doctor_who_library.presentation.api.routes.enrichment",
            "doctor_who_library.presentation.cli.commands",
        ]
    )
