# Doctor Who Library

A modern Doctor Who media library with TARDIS Wiki integration - Plex-style browser with enriched metadata.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry
- Node.js 18+

### Installation
```bash
# Install backend dependencies
poetry install

# Install frontend dependencies
cd frontend && npm install

# Set up environment (if needed)
cp .env.example .env  # Optional: customize settings
```

## 🔧 Running Backend + Frontend Together

### Option 1: Single Command (Recommended) ⭐
```bash
poetry run dw-cli dev
```
This single command starts both backend and frontend servers and manages them together. Press `Ctrl+C` to stop both servers.

### Option 2: Two Terminal Windows
**Terminal 1 - Backend:**
```bash
poetry run dw-cli serve
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 3: Background Process
```bash
# Start backend in background
poetry run dw-cli serve &

# Start frontend in foreground
cd frontend && npm run dev
```

### Option 4: Process Manager (tmux/screen)
```bash
# Using tmux
tmux new-session -d -s backend 'poetry run dw-cli serve'
tmux new-session -d -s frontend 'cd frontend && npm run dev'
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔄 About the Enricher

**The enricher does NOT run automatically** with the backend. It's designed as a separate operation that you run manually or schedule.

### Manual Enrichment
```bash
# Run enrichment on pending items
poetry run dw-cli enrich

# Run with specific batch size
poetry run dw-cli enrich --batch-size 5

# Run with item limit
poetry run dw-cli enrich --max-items 100
```

### Check Enrichment Status
```bash
poetry run dw-cli stats
```

### API Enrichment Endpoints
The backend also provides API endpoints for enrichment:
- `POST /api/v1/enrichment/run` - Run enrichment
- `GET /api/v1/enrichment/stats` - Get enrichment statistics
- `POST /api/v1/enrichment/items/{item_id}/enrich` - Enrich single item

## 🔄 Automated Enrichment Options

### 1. Frontend Integration
The frontend already has an `EnrichmentManager` component that can trigger enrichment via API calls.

### 2. Scheduled Enrichment (Cron)
```bash
# Add to crontab for daily enrichment
0 2 * * * cd /Users/jacobrees/Documents/Doctor\ Who && poetry run dw-cli enrich
```

### 3. Background Service
You could create a background service:

```python
# example_scheduler.py
import asyncio
from doctor_who_library.application.services.enrichment_service import EnrichmentService

async def run_periodic_enrichment():
    while True:
        await asyncio.sleep(3600)  # Run every hour
        # Run enrichment logic
```

### 4. Celery Integration
The project already has Celery configured in `pyproject.toml`, you could set up background tasks:

```bash
# Start Celery worker (if implemented)
celery -A doctor_who_library.celery worker --loglevel=info
```

## 📊 Complete Development Setup

```bash
# 1. Start both backend and frontend
poetry run dw-cli dev

# 2. Run initial enrichment (new terminal)
poetry run dw-cli enrich

# 3. Check stats
poetry run dw-cli stats
```

**Alternative (separate terminals):**
```bash
# Terminal 1: Start backend
poetry run dw-cli serve

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Run enrichment
poetry run dw-cli enrich
```

## 🔄 Enrichment Workflow

1. **Initial Setup**: Import your data (if needed)
2. **Run Enrichment**: `poetry run dw-cli enrich`
3. **Monitor Progress**: Check logs and stats
4. **Use Frontend**: Browse enriched content
5. **Periodic Updates**: Run enrichment as needed

The enricher is intentionally separate to give you control over when and how enrichment runs, especially since it makes external API calls to TARDIS Wiki.

## 🏗️ Architecture

This project follows **Domain-Driven Design (DDD)** principles with **Clean Architecture** patterns:

```
src/doctor_who_library/
├── domain/          # Core business logic (no dependencies)
├── application/     # Application services and orchestration
├── infrastructure/  # External concerns (database, APIs)
├── presentation/    # User interfaces (API, CLI)
└── shared/         # Cross-cutting concerns
```

## 🚀 Key Features

### ✅ **Modern Architecture**
- **Dependency Injection**: Full DI container with `dependency-injector`
- **Repository Pattern**: Async repository implementations
- **Type Safety**: Full type annotations with Python 3.11+
- **Async-First**: Consistent async/await throughout

### ✅ **Enhanced Wiki Enrichment**
- **Priority-based search**: Story titles first, then episode titles
- **Intelligent fallback**: Automatic retry with different search terms
- **Confidence scoring**: Quality assessment for enrichment matches
- **Concurrent processing**: Batch processing with rate limiting

### ✅ **Modern API**
- **API versioning**: `/api/v1/` prefix
- **Pagination**: Efficient data retrieval
- **Proper HTTP status codes**: RESTful design
- **Structured error responses**: Consistent error format

### ✅ **Enhanced CLI**
- **Rich console output**: Progress bars, tables, styling
- **Async command support**: Non-blocking operations
- **Better error messages**: User-friendly feedback

## 🧪 Development

### Available Commands
```bash
# CLI Commands
poetry run dw-cli dev        # Start both backend and frontend (recommended)
poetry run dw-cli serve      # Start API server only
poetry run dw-cli enrich     # Run enrichment
poetry run dw-cli stats      # Show library statistics
poetry run dw-cli search     # Search library items
poetry run dw-cli reset-enrichment  # Reset enrichment status

# Development
poetry run black .           # Format code
poetry run ruff check .      # Lint code
poetry run mypy .           # Type check
```

### Configuration
Environment variables can be configured in `.env` file:
```bash
# Database
DATABASE_URL=sqlite:///doctor_who_library.db

# API
API_HOST=127.0.0.1
API_PORT=8000

# Wiki
WIKI_CONFIDENCE_THRESHOLD=0.7
WIKI_REQUEST_DELAY=1.0

# Enrichment
ENRICHMENT_BATCH_SIZE=10
ENRICHMENT_MAX_CONCURRENT=5
```

## 📁 Project Structure

```
├── src/doctor_who_library/     # Backend source code
├── frontend/                   # React frontend
├── pyproject.toml             # Backend dependencies
├── README.md                  # This file
└── .env                       # Environment configuration
```

## 🤝 Contributing

This project uses modern Python development practices:
- **Code formatting**: Black
- **Linting**: Ruff
- **Type checking**: MyPy
- **Testing**: pytest (framework ready)

## 🐛 Troubleshooting

### Common Issues

**"ModuleNotFoundError: No module named 'dependency_injector'"**
```bash
poetry install  # Make sure all dependencies are installed
```

**"Extra inputs are not permitted" validation errors**
```bash
# Check your .env file matches the new settings structure
# See .env configuration section above
```

**Backend server fails to start**
```bash
# Test individual components
poetry run python -c "from src.doctor_who_library.shared.config.settings import get_settings; print('Settings OK')"
```

**Frontend fails to start**
```bash
cd frontend
npm install  # Reinstall dependencies
npm run dev  # Test separately
```

## 📝 License

MIT License - See LICENSE file for details.