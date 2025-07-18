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

### Frontend Development Standards

**React Component Structure:**
All React components must follow these patterns:

**CSS Class Naming:**
- Every React component must have a CSS class on its top-level element
- CSS class name should be the filename converted from PascalCase to kebab-case
- Examples:
  - `HeaderNavigation.tsx` → `header-navigation` class
  - `ContentCard.tsx` → `content-card` class
  - `LandingPage.tsx` → `landing-page` class
  - `ApiDocumentationPage.tsx` → `api-documentation-page` class

**Component Documentation:**
- All new components must include JSDoc header with this format:
```typescript
/**
 * Component Name
 * 
 * Brief description of component purpose
 */
```
- Include line breaks and punctuation exactly as shown
- Be concise but descriptive about component functionality

**Implementation Pattern:**
```typescript
/**
 * Example Component
 * 
 * Sample component showing proper CSS class usage
 */
import React from 'react';

const ExampleComponent: React.FC = () => {
  return (
    <div className="example-component existing-classes">
      {/* Component content */}
    </div>
  );
};

export default ExampleComponent;
```

### Architecture Decisions
- **Developer-focused:** Enrichment is CLI-only, not exposed via API
- **Confidence scoring:** Wiki enrichment includes quality metrics
- **Flexible data model:** Supports various Doctor Who media types
- **Async processing:** Wiki enrichment uses async for better performance
- **Component identification:** All React components use filename-based CSS classes for easier styling and debugging

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

## Data Standards and Naming Conventions

The project follows strict naming conventions to ensure consistency across Excel imports, database storage, and API responses. **All data must adhere to the standards defined in `NAMING_CONVENTIONS.md`.**

### Key Standards

**Section Names:**
- Must match predefined list exactly (68 approved sections)
- Examples: `4th Doctor`, `Torchwood and Captain Jack`, `Dalek Empire & I, Davros`
- Case-sensitive and no custom sections without approval

**Story Titles:**
- Use official BBC/Big Finish titles
- Include subtitles if part of official title
- No abbreviations unless part of official title
- Maximum 200 characters

**Excel Sheet Requirements:**
- Required columns: `section_name`, `story_title`, `episode_title`, `serial_title`, `content_type`, `format`, `doctor`, `companions`, `story_number`, `series`, `broadcast_date`, `duration`
- Optional columns: `writer`, `director`, `producer`, `release_date`, `cover_date`, `group_name`
- Date format: ISO 8601 (`YYYY-MM-DD`)
- Duration: Always in minutes (integers only)

**Quality Assurance:**
- All section names validated against approved list
- No duplicate story entries within same section
- Date formats consistent
- Duration values reasonable (5-300 minutes)
- Required fields populated

### Special Cases

**Multi-Doctor Stories:** Use primary Doctor's section (`The Day of the Doctor` → `11th Doctor`)
**Crossover Stories:** Use primary character's section (`School Reunion` → `10th Doctor`)
**Regeneration Stories:** Use outgoing Doctor's section (`The End of Time` → `10th Doctor`)
**War Doctor Stories:** Use dedicated `War Doctor` section
**Unbound Stories:** Use `Unbound Doctor` section

**📋 Always consult `NAMING_CONVENTIONS.md` before adding or modifying data.**

## Common Tasks

**Add new content:**
1. **Verify naming conventions** - Check `NAMING_CONVENTIONS.md` for proper section/story naming
2. Update Excel chronology file following required column structure
3. Run import: `dw-cli convert data/raw/DOCTOR\ WHO\ CHRONOLOGY.xlsx --clear`
4. Run enrichment: `dw-cli enrich`

**Update existing data:**
1. **Backup first** - Always export current data before changes
2. **Follow naming conventions** - Ensure all updates match `NAMING_CONVENTIONS.md`
3. **Test small batches** - Update 10-20 entries first
4. **Verify enrichment** - Check that TARDIS Wiki links still work

**Reset enrichment:**
1. Use enricher service to reset status
2. Re-run enrichment command

**Debug database:**
- Database file: `doctor_who_library.db`
- Enable SQL logging: Set `DATABASE_ECHO=true` in `.env`

**Data validation:**
- Section names must match approved list exactly
- Story titles follow official naming standards
- Excel sheets include all required columns
- Dates use ISO 8601 format
- Duration values are in minutes

This documentation provides the foundation for understanding and working with the Doctor Who Library codebase. The architecture is designed to be developer-friendly with clear separation of concerns and comprehensive CLI tooling. **Always follow the naming conventions in `NAMING_CONVENTIONS.md` to maintain data consistency.**