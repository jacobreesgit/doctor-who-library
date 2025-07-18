"""Database connection utilities for direct SQLite access."""

import sqlite3
from collections.abc import Generator
from contextlib import contextmanager

from doctor_who_library.shared.config.settings import get_settings


@contextmanager
def get_sqlite_connection() -> Generator[sqlite3.Connection, None, None]:
    """Get a SQLite database connection with proper cleanup."""
    settings = get_settings()
    # Extract just the filename from the database URL
    db_path = settings.database.url.split("///")[-1]

    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row  # Enable column access by name
        yield conn
    finally:
        conn.close()


def execute_query(query: str, params: tuple = ()) -> list:
    """Execute a SELECT query and return results."""
    with get_sqlite_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()


def execute_update(query: str, params: tuple = ()) -> int:
    """Execute an UPDATE/INSERT/DELETE query and return affected rows."""
    with get_sqlite_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        affected_rows = cursor.rowcount
        conn.commit()
        return affected_rows
