"""CLI package."""

from .commands import cli

# Export CLI functions for scripts
def convert():
    """Convert Excel file to database."""
    cli(["convert"])

def migrate():
    """Initialize database."""
    cli(["migrate"])