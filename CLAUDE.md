# Doctor Who Library - CLAUDE Documentation

## Project Overview

**Doctor Who Library** is a FastAPI-based web service that provides a "Plex-style" media browser for Doctor Who content with TARDIS Wiki integration. The application allows users to browse and search through Doctor Who stories, episodes, and media with enriched metadata from the TARDIS Wiki.

### Key Features
- FastAPI REST API with automatic OpenAPI documentation
- SQLite database with SQLAlchemy ORM
- TARDIS Wiki integration for metadata enrichment
- Excel chronology import system
- Developer-focused CLI tools
- Rich console output for development workflows

## Architecture

### Backend Stack
- **Python 3.11+** - Core language
- **FastAPI** - Web framework with automatic API documentation
- **SQLAlchemy 2.0** - ORM and database abstraction
- **Pydantic** - Data validation and settings management
- **SQLite** - Database (easily replaceable with PostgreSQL)
- **Poetry** - Dependency management
- **Rich** - Enhanced console output
- **Click** - CLI framework

### Project Structure
```
src/doctor_who_library/
├── api/                    # FastAPI application
│   ├── app.py             # Application factory
│   └── routes/            # API route handlers
│       ├── health.py      # Health check endpoints
│       ├── library.py     # Library item endpoints
│       └── conversion.py  # Data conversion endpoints
├── cli/                   # Developer CLI commands
│   └── commands.py        # CLI command definitions
├── core/                  # Core application logic
│   └── config.py          # Configuration management
├── database/              # Database layer
│   ├── connection.py      # Database connection setup
│   └── models.py          # SQLAlchemy models
├── models/                # Pydantic models (currently empty)
├── services/              # Business logic services
│   ├── excel_converter.py # Excel import service
│   ├── wiki_enricher.py   # Wiki metadata enrichment
│   └── wiki_scraper.py    # Wiki scraping service
└── main.py               # Application entry point
```

### Data Model

The core entity is `LibraryItem` which represents a Doctor Who story/episode with:

**Core Fields:**
- `title`, `story_title`, `episode_title`, `serial_title` - Various title formats
- `content_type` - TV, Audio, Comic, etc.
- `section_name` - Doctor era grouping
- `group_name` - Story arc/series grouping

**Personnel:**
- `doctor`, `companions`, `writer`, `director`, `producer`

**Production:**
- `story_number`, `series`, `format`, `duration`
- `broadcast_date`, `release_date`, `cover_date`

**Enrichment:**
- `wiki_url`, `wiki_summary`, `wiki_image_url`
- `enrichment_status` - pending, enriched, failed, skipped
- `enrichment_confidence` - Quality score for enrichment

## Development Workflow

### Setup
1. **Install dependencies:** `poetry install`
2. **Configure environment:** Copy `.env.example` to `.env`
3. **Initialize database:** `poetry run dw-cli migrate`
4. **Import data:** `poetry run dw-cli convert data/raw/DOCTOR\ WHO\ CHRONOLOGY.xlsx --clear`
5. **Start server:** `poetry run dw-serve`

### CLI Commands

**Data Management:**
- `dw-cli convert <excel_file>` - Import Excel chronology to database
- `dw-cli migrate` - Initialize database tables
- `dw-cli clear` - Clear all database data (destructive)

**Content Enrichment:**
- `dw-cli enrich` - Enrich library items with TARDIS Wiki metadata
- Options: `--batch-size`, `--max-items`, `--confidence`

**Development Server:**
- `dw-serve` - Start FastAPI server with hot-reload in debug mode

### API Endpoints

**Health:**
- `GET /api/health` - Basic health check

**Library:**
- `GET /api/library/items` - List library items (with filtering)
- `GET /api/library/items/{id}` - Get specific item
- `GET /api/library/sections` - List organizational sections
- `GET /api/library/search?q={query}` - Search library items
- `GET /api/library/stats` - Get library statistics

**Data:**
- Data conversion endpoints (check `conversion.py`)

### Configuration

Configuration is managed through Pydantic Settings with environment variable support:

**Key Settings:**
- `API_HOST`, `API_PORT` - Server configuration
- `DATABASE_URL` - Database connection
- `WIKI_BASE_URL`, `WIKI_API_URL` - TARDIS Wiki integration
- `ENRICHMENT_BATCH_SIZE`, `ENRICHMENT_CONFIDENCE_THRESHOLD` - Enrichment settings

See `.env.example` for all available configuration options.

## Key Services

### ExcelConverter
- Converts Excel chronology files to database entries
- Handles section and group hierarchy
- Supports data clearing and incremental updates

### WikiEnricher
- Enriches library items with TARDIS Wiki metadata
- Batch processing with configurable confidence thresholds
- Async processing for better performance
- Tracks enrichment status and confidence scores

### WikiScraper
- Interfaces with TARDIS Wiki API
- Handles search, disambiguation, and content extraction
- Implements rate limiting and error handling

## Data Flow

1. **Import:** Excel chronology → Database (via CLI)
2. **Enrichment:** Database items → TARDIS Wiki API → Enhanced metadata (via CLI)
3. **API:** Database → JSON responses for frontend consumption

## Database Schema

**LibraryItem** - Core content table
**LibrarySection** - Organizational sections (Doctor eras)
**LibraryGroup** - Sub-groups within sections (story arcs)

All tables use UUID primary keys and include created/updated timestamps.

## Development Notes

### Code Quality
- **Black** - Code formatting (line length: 88)
- **isort** - Import sorting
- **mypy** - Type checking
- **ruff** - Additional linting
- **pytest** - Testing framework (no tests currently implemented)

### Architecture Decisions
- **Developer-focused:** Enrichment is CLI-only, not exposed via API
- **Confidence scoring:** Wiki enrichment includes quality metrics
- **Flexible data model:** Supports various Doctor Who media types
- **Async processing:** Wiki enrichment uses async for better performance

### Future Considerations
- No frontend currently exists
- Testing infrastructure is set up but no tests implemented
- PostgreSQL support available but SQLite is default
- Redis/Celery configured but not actively used

## API Documentation

When the server is running, visit:
- **Interactive docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## Common Tasks

**Add new content:**
1. Update Excel chronology file
2. Run import: `dw-cli convert data/raw/DOCTOR\ WHO\ CHRONOLOGY.xlsx --clear`
3. Run enrichment: `dw-cli enrich`

**Reset enrichment:**
1. Use enricher service to reset status
2. Re-run enrichment command

**Debug database:**
- Database file: `doctor_who_library.db`
- Enable SQL logging: Set `DATABASE_ECHO=true` in `.env`

This documentation provides the foundation for understanding and working with the Doctor Who Library codebase. The architecture is designed to be developer-friendly with clear separation of concerns and comprehensive CLI tooling.