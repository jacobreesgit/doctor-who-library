"""Doctor Who Library - Modern media management system."""

__version__ = "1.0.0"
__description__ = "Doctor Who Media Library - Plex-style browser with TARDIS Wiki integration"
__author__ = "Doctor Who Library Team"

from .shared.config.settings import get_settings
from .shared.config.container import get_container, wire_container

__all__ = [
    "get_settings",
    "get_container", 
    "wire_container",
]