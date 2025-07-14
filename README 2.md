# Doctor Who Library

A comprehensive CLI tool and API for managing Doctor Who chronology data with metadata enrichment from TARDIS Wiki.

## 🎯 Project Overview

This project provides a complete backend solution for managing and enriching Doctor Who story metadata. It features:

- **Data Processing**: Convert Excel chronology files to structured JSON
- **Metadata Enrichment**: Batch enrichment of stories with rich metadata from TARDIS Wiki
- **Content Type Mapping**: Automatic mapping to proper TARDIS Wiki disambiguation terms
- **CLI Interface**: Comprehensive command-line tools for all operations
- **Production Ready**: Structured logging, error handling, and testing

## 🧩 When to Use Each Component

### CLI Tools (Primary Interface)
**Use the CLI when you want to:**
- **Process data locally** - Convert Excel files, enrich metadata, verify data
- **One-time operations** - Initial setup, bulk processing, maintenance tasks
- **Development & testing** - Quick access to all functionality without API overhead
- **Scripting & automation** - Integrate with shell scripts or CI/CD pipelines

```bash
# Examples of CLI usage
poetry run dw-cli convert data/raw/chronology.xlsx    # Data processing
poetry run dw-cli enrich-all --output data/enriched/  # Bulk enrichment  
poetry run dw-cli info                                # Quick stats
poetry run dw-cli verify --detailed                   # Data validation
```

### Redis + Background Workers
**Redis is required when you want to:**
- **Process large datasets** - Enrich all 2,369 stories without blocking
- **Resume interrupted operations** - Crash-safe processing with progress tracking
- **Scale horizontally** - Run multiple workers for faster processing
- **Real-time progress updates** - Monitor long-running jobs via API
- **Future web interface** - Essential for responsive user experience

```bash
# Redis powers background processing
make redis     # Start Redis server
make worker    # Start background worker
make api       # API can now queue jobs to Redis
```

### API Server (Future Web Interface)
**Use the API when you want to:**
- **Build web applications** - RESTful endpoints for frontend consumption
- **Real-time monitoring** - Track enrichment progress, view statistics
- **Remote access** - Access library data from other applications
- **Production deployments** - Scalable server for multiple users

```bash
# API provides programmatic access
make api       # Start FastAPI server
curl http://localhost:8000/api/v1/library/stats  # Get library statistics
curl http://localhost:8000/api/v1/jobs/status    # Check job progress
```

## 🔮 Future Nuxt Frontend Integration

### Current State (Backend Only)
- ✅ **Complete Python CLI** - All functionality available via command line
- ✅ **FastAPI Backend** - RESTful endpoints ready for frontend consumption
- ✅ **Background Processing** - Redis/Celery for scalable metadata enrichment
- ✅ **Production Ready** - Logging, error handling, comprehensive testing

### Planned Nuxt Frontend Features
The API is designed to support a future Nuxt.js frontend with these capabilities:

#### 📚 **Library Browser**
- **Story exploration** - Browse 2,369 stories across 70 sections/eras
- **Rich metadata display** - Show enriched data from TARDIS Wiki
- **Search & filtering** - Find stories by title, era, content type, etc.
- **Responsive design** - Mobile-first interface for all devices

#### 🔍 **Advanced Search**
- **Global search** - Search across all stories and metadata
- **Filtered views** - By Doctor, era, content type, production company
- **Smart suggestions** - Autocomplete with confidence scoring
- **Saved searches** - Bookmark frequent queries

#### ⚡ **Real-time Operations**
- **Live enrichment** - Watch metadata enrichment happen in real-time
- **Progress tracking** - Visual progress bars for batch operations
- **Job management** - Start/stop/resume enrichment jobs from the web
- **Status dashboard** - System health, Redis status, worker activity

#### 📊 **Analytics & Insights**
- **Library statistics** - Visual charts of content distribution
- **Enrichment metrics** - Success rates, processing times, coverage
- **Data visualization** - Interactive charts and graphs
- **Export capabilities** - CSV, JSON exports of filtered data

### API Endpoints Ready for Frontend
```javascript
// Library data
GET /api/v1/library/stats           // Overall statistics
GET /api/v1/library/sections        // All sections (eras)
GET /api/v1/library/stories         // Paginated story list
GET /api/v1/library/search          // Search functionality

// Enrichment management
POST /api/v1/enrichment/start       // Start background enrichment
GET /api/v1/enrichment/status       // Check enrichment progress
POST /api/v1/enrichment/stop        // Stop running jobs

// Job monitoring
GET /api/v1/jobs/active             // Active background jobs
GET /api/v1/jobs/history            // Job history and results
```

### Development Workflow (Backend → Frontend)
1. **Current**: Use CLI for all operations
2. **Transition**: API provides same functionality remotely
3. **Future**: Nuxt frontend consumes API endpoints
4. **Complete**: Web interface with real-time features

### Why This Architecture?
- **Separation of concerns** - Backend handles data, frontend handles UI
- **Scalability** - API can serve multiple frontends (web, mobile, desktop)
- **Flexibility** - CLI remains available for power users and automation
- **Performance** - Background processing keeps UI responsive
- **Reliability** - Redis ensures job persistence and recovery

## 🏗️ Architecture

### Python CLI Application

This is a **Python CLI application** for processing Doctor Who chronology data:

```
doctor-who-library/
├── src/doctor_who_library/     # 🐍 Python Backend (CLI)
│   ├── cli/                    # Click-based command interface
│   │   ├── commands/           # Individual CLI commands
│   │   └── main.py            # Entry point
│   ├── core/                   # Configuration, logging, exceptions
│   ├── models/                 # Pydantic data models with validation
│   ├── services/               # Business logic (LibraryService, MetadataFetcher)
│   └── utils/                  # HTTP client, text processing, wiki parsing
├── data/                       # Data processing pipeline
│   ├── raw/                    # Source Excel files
│   ├── processed/              # Converted JSON library data
│   └── enriched/               # Individual story metadata files
├── tests/                      # Unit and integration tests
└── Makefile                    # Unified command interface
```

### Key Components

- **CLI Tools**: Primary interface for all operations
- **Data Conversion**: Excel to JSON conversion with validation
- **Metadata Enrichment**: TARDIS Wiki integration with smart search
- **Content Type Mapping**: Automatic disambiguation term mapping
- **JSON Output**: Structured files for each enriched story
- **Progress Tracking**: Resumable batch operations

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry (for dependency management)
- Redis (for background job processing)

### Redis Setup & Purpose

Redis is essential for this application as it powers the background job processing system. Here's why Redis is needed and how to set it up:

**Why Redis?**
- **Background Jobs**: Powers Celery workers for asynchronous metadata enrichment
- **Job Queuing**: Manages queues for batch processing of 2,000+ stories
- **Progress Tracking**: Stores real-time progress updates for long-running operations
- **Caching**: Improves performance by caching frequently accessed data
- **Scalability**: Enables horizontal scaling of enrichment workers

**Installation Options:**

1. **macOS (Homebrew):**
   ```bash
   brew install redis
   brew services start redis
   ```

2. **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

3. **Docker:**
   ```bash
   docker run -d -p 6379:6379 --name redis redis:alpine
   ```

4. **Verify Installation:**
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

**Redis Configuration:**
- **Default Port**: 6379
- **Host**: localhost
- **Database**: 0 (default)
- **No authentication required** for local development

**Health Check:**
```bash
make health  # Includes Redis connectivity check
```

### Installation

1. **Install dependencies:**
   ```bash
   make install  # Install Python dependencies
   ```

2. **Start the complete system:**
   ```bash
   # Option 1: Start everything automatically
   python start_system.py

   # Option 2: Start services manually
   make redis    # Start Redis server
   make worker   # Start Celery worker (in new terminal)
   make api      # Start FastAPI server (in new terminal)
   ```

3. **Access the API:**
   - API: http://127.0.0.1:8000
   - Documentation: http://127.0.0.1:8000/docs
   - Test: `python test_api.py`

### CLI Usage

**Basic Commands:**
```bash
make info         # Show library statistics
make verify       # Validate data integrity
   ```

### Basic Usage

#### ⚡ **Data Processing**

```bash
# Convert Excel chronology to JSON
make convert FILE=data/raw/DOCTOR_WHO_CHRONOLOGY.xlsx

# Verify library data
make verify

# Show library statistics
make info
```

#### 🔍 **Metadata Enrichment**

```bash
# Enrich all stories (batch processing)
make enrich-all

# Enrich specific story
make enrich-story STORY="An Unearthly Child"

# Resume interrupted enrichment
poetry run dw-cli enrich-all --resume
```


## 📊 Data Processing Pipeline

The system processes Doctor Who chronology data through these stages:

1. **Excel Source** → `data/raw/DOCTOR_WHO_CHRONOLOGY.xlsx`
2. **Conversion** → `poetry run dw-cli convert` → `data/processed/doctor_who_library.json`
3. **Enrichment** → `poetry run dw-cli enrich-all` → `data/enriched/*.json`
4. **Individual Files** → Each story gets its own JSON file with metadata

### Content Type Mapping

The system automatically maps library content types to proper TARDIS Wiki disambiguation terms for accurate metadata retrieval. This ensures that stories are found correctly regardless of how they're categorized in the source data.

#### Television & Video Content

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| BBC Television | TV story |
| BBC TV | TV story |
| BBC One | TV story |
| BBC Two | TV story |
| BBC Three | TV story |
| BBC Four | TV story |
| BBC iPlayer | TV story |
| Children in Need | TV story |
| Comic Relief | TV story |
| Red Nose Day | TV story |
| BBC Minisode | TV story |
| BBC DVD Minisode | TV story |
| BBC Online Minisode | TV story |
| TARDISODE | TV story |
| Children in Need Minisode | TV story |
| Comic Relief Minisode | TV story |
| Red Nose Day Minisode | TV story |
| Film | theatrical film |
| Cinema | theatrical film |
| Theatrical | theatrical film |
| Movie | theatrical film |

#### Audio Content

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Big Finish Productions | audio story |
| BBC Audio | audio story |
| BBC 7 | audio story |
| BBC Radio | audio story |
| Audio | audio story |
| Audiobook | audio story |
| BBC 7 / Big Finish Productions | audio story |
| BBC Audio / Big Finish Productions | audio story |

#### Web & Digital Content

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Lockdown Minisode | webcast |
| Webcast | webcast |
| BBC Online | webcast |
| BBC iPlayer Exclusive | webcast |
| YouTube | webcast |
| Online | webcast |

#### Home Video

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| VHS | home video |
| DVD | home video |
| Blu-ray | home video |
| Home Video | home video |
| Video | home video |
| BBV | home video |
| Reeltime Pictures | home video |

#### Books & Literature

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Novel | novel |
| Novella | novel |
| Book | novel |
| Hardback | novel |
| Paperback | novel |
| Target Books | novel |
| Virgin New Adventures | novel |
| Virgin Missing Adventures | novel |
| BBC Books | novel |
| BBC Past Doctor Adventures | novel |
| BBC Eighth Doctor Adventures | novel |
| New Series Adventures | novel |
| Quick Reads | novel |
| Short Story | short story |
| Prose | short story |
| Annual | short story |
| Magazine | short story |
| DWM | short story |
| Doctor Who Magazine | short story |

#### Comics & Graphics

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Comic | comic story |
| Comic Strip | comic story |
| Comic Book | comic story |
| Graphic Novel | graphic novel |
| DWM Comic | comic story |
| Doctor Who Magazine Comic | comic story |
| IDW | comic story |
| Titan Comics | comic story |
| Panini Comics | comic story |

#### Games

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Video Game | video game |
| Game | video game |
| PC Game | video game |
| Console Game | video game |
| Mobile Game | video game |
| Board Game | game |
| RPG | game |
| Tabletop | game |

#### Reference & Features

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| Reference Book | reference book |
| Encyclopedia | reference book |
| Guide | reference book |
| Handbook | reference book |
| Feature | feature |
| Profile | feature |
| Article | feature |
| Documentary | documentary |
| Behind the Scenes | documentary |
| BTS | documentary |
| Making of | documentary |
| Featurette | documentary |

#### Special Episodes

| Library Content Type | TARDIS Wiki Term |
|----------------------|------------------|
| CON episode | CON episode |
| Doctor Who Confidential | CON episode |
| DWE episode | DWE episode |
| Doctor Who Extra | DWE episode |

#### Smart Pattern Matching

The system also includes intelligent pattern matching for content types not explicitly listed above:

- **Television patterns**: `BBC Television`, `BBC One`, `BBC iPlayer`, etc. → `TV story`
- **Audio patterns**: `Big Finish`, `BBC Audio`, `BBC Radio`, etc. → `audio story`
- **Video patterns**: `VHS`, `DVD`, `Blu-ray`, etc. → `home video`
- **Book patterns**: `Target Books`, `Virgin Adventures`, `BBC Books`, etc. → `novel`
- **Comic patterns**: `DWM Comic`, `Doctor Who Magazine`, etc. → `comic story`
- **Game patterns**: `PC Game`, `Console Game`, `Board Game`, etc. → `video game` or `game`
- **Web patterns**: `Webcast`, `Online`, `YouTube`, etc. → `webcast`

#### Search Term Generation

For each story, the system generates multiple search terms in order of preference:

1. **Primary**: `"Story Title (disambiguation term)"` (e.g., "Fast Times (audio story)")
2. **Secondary**: Common variations (e.g., "Fast Times (audio)", "Fast Times (Big Finish)")
3. **Fallback**: Just the title without disambiguation

This multi-tier approach ensures maximum compatibility with TARDIS Wiki's naming conventions while maintaining high accuracy in metadata retrieval.

## 🔧 CLI Commands

### Core Commands

```bash
# Data management
poetry run dw-cli convert <file>      # Convert Excel to JSON
poetry run dw-cli verify              # Verify data integrity
poetry run dw-cli info                # Show library statistics

# Metadata enrichment
poetry run dw-cli enrich <title> <type>  # Enrich single story
poetry run dw-cli enrich-all          # Batch enrich all stories
```

### Enrichment Options

```bash
# Batch enrichment with filters
poetry run dw-cli enrich-all --section "1st Doctor" --output data/enriched/

# Resume interrupted enrichment
poetry run dw-cli enrich-all --resume --output data/enriched/

# Dry run to see what would be processed
poetry run dw-cli enrich-all --dry-run

# Single story enrichment
poetry run dw-cli enrich "Genesis of the Daleks" "BBC Television" --output data/enriched/
```

## 📁 Output Structure

### Enriched Story Files

Each enriched story creates a comprehensive JSON file:

```json
{
  "library_story": {
    "section": "4th Doctor",
    "item": { /* original library data */ }
  },
  "search_query": {
    "title": "Genesis of the Daleks",
    "original_content_type": "BBC Television",
    "normalized_content_type": "TV story",
    "search_terms": ["Genesis of the Daleks (TV story)", "..."],
    "search_options": { /* search configuration */ }
  },
  "metadata": {
    "success": true,
    "title": "Genesis of the Daleks (TV story)",
    "confidence_score": 0.95,
    "page_url": "https://tardis.wiki/wiki/Genesis_of_the_Daleks_(TV_story)",
    "doctor": "Fourth Doctor",
    "companions": ["Sarah Jane Smith", "Harry Sullivan"],
    "writer": "Terry Nation",
    "director": "David Maloney",
    "broadcast_date": "8 March - 12 April 1975",
    "description": "...",
    "cast": ["..."],
    /* additional metadata */
  },
  "enrichment_timestamp": "2024-01-15T10:30:00Z",
  "enrichment_success": true
}
```

### File Organization

```
data/
├── raw/
│   └── DOCTOR_WHO_CHRONOLOGY.xlsx    # Source Excel file
├── processed/
│   └── doctor_who_library.json       # Converted library data
└── enriched/
    ├── 1st_Doctor__An_Unearthly_Child.json
    ├── 4th_Doctor__Genesis_of_the_Daleks.json
    ├── enrichment_progress.json       # Progress tracking
    └── enrichment_summary.json        # Batch statistics
```


## ⚙️ Configuration

### Environment Variables

```bash
# Application
APP_NAME="Doctor Who Library"
DEBUG=false

# Data
DATA_DIR=data
LIBRARY_FILE=doctor_who_library.json

# TARDIS Wiki
WIKI_BASE_URL=https://tardis.wiki/wiki/
WIKI_USER_AGENT=DoctorWhoApp/1.0
WIKI_REQUEST_DELAY=0.1
WIKI_TIMEOUT=30

# Metadata
METADATA_CONFIDENCE_THRESHOLD=0.5
METADATA_MAX_DISAMBIGUATION=10

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

## 🧪 Testing

```bash
# Run all tests
make test
poetry run pytest

# Run with coverage
poetry run pytest --cov=doctor_who_library --cov-report=html

# Run specific test types
poetry run pytest tests/unit/
poetry run pytest tests/integration/
```

## 🔧 Development

### Code Quality Tools

```bash
# Format code
make format
poetry run black src/ tests/
poetry run isort src/ tests/

# Lint code
make lint
poetry run ruff src/ tests/

# Type checking
poetry run mypy src/
```

### Adding New Content Types

1. **Update mapping** in `src/doctor_who_library/utils/content_type_mapping.py`
2. **Add to CONTENT_TYPE_MAPPING** dictionary
3. **Add pattern matching** if needed
4. **Update tests** and documentation

## 📈 Monitoring & Observability

### Structured Logging

```python
from doctor_who_library.core.logging import get_logger

logger = get_logger(__name__)
logger.info("Processing story", title="Spare Parts", confidence=0.85)
```

### Progress Tracking

- **Batch Operations**: Real-time progress bars with ETA
- **Resumable**: Interrupted operations can be resumed
- **Statistics**: Success rates and error tracking
- **Detailed Logs**: Comprehensive logging for debugging

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Run quality checks (`make lint && make test`)
5. Submit pull request

### Code Standards

- **Python**: PEP 8, type hints, docstrings
- **Testing**: High coverage, integration tests
- **Documentation**: Clear and comprehensive
- **CLI**: Rich console output with progress indicators

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TARDIS Wiki**: For providing comprehensive Doctor Who information
- **Big Finish Productions**: For audio drama metadata
- **BBC**: For television story information
- **Doctor Who Community**: For maintaining the chronology data

---

## 🚀 Quick Commands Reference

```bash
# Setup & Management
make install                         # Install Python dependencies
make health                          # Check system requirements
make dev                             # Show library information

# Data Processing  
make convert FILE=data/raw/file.xlsx # Convert Excel to JSON
make verify                          # Verify library data
make info                            # Show library statistics

# Metadata Enrichment
make enrich-all                      # Batch enrich all stories
make enrich-story STORY="Title"      # Enrich specific story
poetry run dw-cli enrich-all --resume  # Resume interrupted batch

# Quality & Testing
make test                            # Run all tests
make lint                            # Lint code
make format                          # Format code
make clean                           # Clean build artifacts

# Production
make build                           # Build for production
```

## 🌐 Frontend Integration

Your Nuxt app can now:
1. **Browse library data** via REST endpoints
2. **Trigger enrichment jobs** that run in background
3. **Monitor progress** in real-time via WebSocket
4. **Search and filter** stories efficiently
5. **Get analytics** for dashboards

---

Built with ❤️ for the Doctor Who community.
