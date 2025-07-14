# Doctor Who Media Library

A Plex-style media browser for Doctor Who content with dynamic TARDIS Wiki integration.

## 🎯 Project Vision

**Phase 1:** Doctor Who chronology browser with TARDIS Wiki enrichment  
**Phase 2:** Full Plex-style media server with SFTP scanning, personal collections, and streaming

## 📁 Project Structure

```
Doctor Who/
├── README.md                           # Project documentation
├── pyproject.toml                      # Python project configuration
├── doctor_who_library.db               # SQLite database (auto-created)
├── data/
│   └── raw/
│       └── DOCTOR WHO CHRONOLOGY.xlsx  # Source Excel chronology data
└── src/
    └── doctor_who_library/
        ├── api/                        # FastAPI web service (user-facing)
        ├── cli/                        # Developer CLI tools
        ├── database/                   # Database models and connection
        ├── services/                   # Core business logic
        └── core/                       # Configuration and utilities
```

## 🚀 Architecture

### 🔧 Developer Tools (CLI)
- **Excel Converter** - Process chronology file to database
- **TARDIS Wiki Scraper** - Automated metadata enrichment
- **Database Management** - Initialize, migrate, clear data

### 🌐 User Interface (API)
- **FastAPI Service** - Clean, read-only REST API
- **Library Browser** - Search, filter, and browse enriched data
- **Statistics Dashboard** - View collection statistics
- **Health Monitoring** - System status and data population

### 📊 Data Flow

```
DEVELOPER WORKFLOW:
Excel File → CLI Converter → Database → CLI Enrichment → TARDIS Wiki → Enhanced Database

USER WORKFLOW:
Enhanced Database → FastAPI → JSON API → React Frontend (Future)
```

## 🔧 Developer Workflow

### Prerequisites
- Python 3.11+
- Poetry (dependency management)

### Setup
```bash
# Clone and install
git clone <repository-url>
cd doctor-who-library
poetry install

# Initialize database
poetry run dw-cli migrate
```

### Data Management (Developer Only)
```bash
# Convert Excel chronology to database
poetry run dw-cli convert "data/raw/DOCTOR WHO CHRONOLOGY.xlsx"

# Enrich with TARDIS Wiki metadata
poetry run dw-cli enrich --batch-size 10 --max-items 50 --confidence 0.7

# View enrichment help
poetry run dw-cli enrich --help

# Clear all data (destructive)
poetry run dw-cli clear
```

### Start User-Facing API
```bash
# Start web service for users
poetry run dw-serve

# API will be available at:
# - http://localhost:8000/docs (Interactive documentation)
# - http://localhost:8000/api/library/items (Browse library)
# - http://localhost:8000/api/library/stats (Statistics)
```

## 🌐 User API Endpoints

### Library Access
- `GET /api/library/items` - Browse library items (paginated, filtered)
- `GET /api/library/items/{id}` - Get specific item details
- `GET /api/library/stats` - View collection statistics
- `GET /api/library/sections` - Browse by Doctor/era sections
- `GET /api/library/search?q=daleks` - Search library content

### System Status
- `GET /api/health` - Health check with database status
- `GET /api/data/status` - Data population status

### API Features
- **Filtering** - By section, content type, doctor, etc.
- **Pagination** - Limit/offset for large datasets
- **Search** - Full-text search across titles and metadata
- **CORS Enabled** - Ready for React frontend integration

## 🔍 TARDIS Wiki Enrichment

### What Gets Enriched
- **Personnel** - Writer, director, producer details
- **Cast Information** - Main characters and actors
- **Production Details** - Broadcast dates, series information
- **Content Metadata** - Plot summaries, setting details
- **Media Assets** - Cover images and promotional materials

### Enrichment Process
- **Smart Search** - Generates multiple search queries per item
- **Content Type Mapping** - Maps "Big Finish Productions" → "audio story"
- **Confidence Scoring** - Only accepts high-quality matches (configurable threshold)
- **Rate Limiting** - Respects TARDIS Wiki with configurable delays
- **Batch Processing** - Handles large datasets efficiently
- **Error Handling** - Graceful failure with detailed logging

### Configuration Options
```bash
# Enrichment parameters
--batch-size 10        # Items processed simultaneously
--max-items 50         # Total items to process (for testing)
--confidence 0.7       # Minimum confidence threshold (0.0-1.0)
```

## 🛠️ Current Status

- ✅ **Database Models** - SQLAlchemy schemas with proper relationships
- ✅ **Excel Converter** - Robust CLI tool for data import
- ✅ **TARDIS Wiki Scraper** - Intelligent metadata enrichment
- ✅ **FastAPI Service** - Production-ready REST API
- ✅ **Developer CLI** - Complete toolchain for data management
- ✅ **Documentation** - API docs auto-generated at `/docs`
- 🔄 **React Frontend** - Plex-style UI (planned)
- 🔄 **Production Deployment** - Docker, CI/CD (planned)

## 🎯 Key Design Decisions

### Developer vs User Separation
- **Excel processing** - Developer-only CLI tool
- **Wiki enrichment** - Developer-only background process
- **Data management** - Developer CLI with safeguards
- **API consumption** - User-facing, read-only interface
- **No admin UI** - Clean separation of concerns

### Production Considerations
- **SQLite for development** - Simple, no external dependencies
- **PostgreSQL ready** - Easy migration for production
- **Async architecture** - FastAPI with proper async/await
- **Proper error handling** - Graceful degradation and logging
- **Rate limiting** - Respectful wiki scraping with delays

## 📊 Example Data

### Library Item (Enriched)
```json
{
  "id": "uuid-here",
  "title": "Genesis of the Daleks",
  "display_title": "Genesis of the Daleks",
  "content_type": "BBC Television",
  "doctor": "Fourth Doctor",
  "companions": "Sarah Jane Smith, Harry Sullivan",
  "writer": "Terry Nation",
  "director": "David Maloney",
  "enrichment_status": "enriched",
  "enrichment_confidence": 0.95,
  "wiki_url": "https://tardis.wiki/wiki/Genesis_of_the_Daleks_(TV_story)",
  "wiki_summary": "The Time Lords intercept the Fourth Doctor...",
  "wiki_image_url": "https://tardis.wiki/wiki/images/genesis.jpg"
}
```

### Statistics Response
```json
{
  "total_items": 2369,
  "total_sections": 15,
  "total_groups": 89,
  "enrichment_stats": {
    "enriched": 1892,
    "pending": 234,
    "failed": 156,
    "skipped": 87
  },
  "note": "Data is enriched by developers using CLI tools"
}
```

## 🚀 Future Development

### Phase 2 - Frontend
- **React Application** - Modern SPA with Plex-inspired design
- **Real-time Updates** - WebSocket integration for live data
- **Advanced Filtering** - Multi-dimensional search and discovery
- **Responsive Design** - Mobile-first approach

### Phase 3 - Media Management
- **SFTP Scanning** - Automatic media file detection
- **File Organization** - Smart library management
- **Streaming Support** - Direct media playback
- **Personal Collections** - User watchlists and favorites

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **TARDIS Wiki** - For providing comprehensive Doctor Who metadata
- **Plex** - For UI/UX inspiration
- **Doctor Who community** - For maintaining chronology data

---

**Status: ✅ Backend Complete - Ready for Frontend Development**