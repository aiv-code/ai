# Multi-Source Analytics API

A production-ready FastAPI backend for querying multiple data sources using natural language.

## Features

- 🔐 **Multi-tenant Architecture**: Client isolation with API key authentication
- 🔌 **Multiple Data Sources**: PostgreSQL, Excel/CSV, and Parquet file support
- 🤖 **LLM Integration**: Natural language to SQL/filter conversion using Ollama, Groq, or Together.ai
- 📊 **Auto Visualizations**: Automatic visualization suggestions based on query results
- 🔒 **Security**: Credential encryption, SQL injection prevention, query validation
- 📝 **Query History**: Complete audit trail of all queries
- 🚀 **Production Ready**: Dockerized, migrations, health checks

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 16GB+ RAM (for Ollama/Llama model)

### Setup

1. **Run the setup script:**
   ```bash
   cd backend
   chmod +x setup.sh
   ./setup.sh
   ```

   This will:
   - Start PostgreSQL, Ollama, and API containers
   - Download Llama 3.1 model
   - Run database migrations
   - Create a demo client with API key

2. **Access the API:**
   - API Server: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Usage

### 1. Create a Client

```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company"}'
```

Response includes an `api_key` - save this!

### 2. Add a Data Source

**PostgreSQL:**
```bash
curl -X POST http://localhost:8000/api/v1/data-sources \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Production DB",
    "source_type": "postgres",
    "connection_config": {
      "host": "db.example.com",
      "port": 5432,
      "database": "mydb",
      "username": "readonly",
      "password": "secret123"
    }
  }'
```

**Excel/CSV:**
```bash
curl -X POST http://localhost:8000/api/v1/data-sources \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Sales Data",
    "source_type": "excel",
    "connection_config": {
      "file_path": "/data/uploads/sales.xlsx",
      "sheet_name": "Sheet1"
    }
  }'
```

**Parquet:**
```bash
curl -X POST http://localhost:8000/api/v1/data-sources \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Analytics Data",
    "source_type": "parquet",
    "connection_config": {
      "file_path": "/data/uploads/analytics.parquet"
    }
  }'
```

### 3. Query in Natural Language

```bash
curl -X POST http://localhost:8000/api/v1/queries \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me top 10 customers by revenue this year",
    "max_rows": 1000
  }'
```

Response includes:
- Query results as JSON
- Visualization suggestions (bar charts, KPIs, etc.)
- Execution metadata

## Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/v1/              # API endpoints
│   ├── connectors/          # Data source connectors
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
├── scripts/                 # Utility scripts
└── requirements.txt         # Python dependencies
```

## Configuration

Environment variables (in `.env`):

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for encryption (auto-generated)
- `OLLAMA_URL`: Ollama service URL
- `OLLAMA_MODEL`: Model name (default: llama3.1)
- `LLM_PROVIDER`: ollama, groq, or together
- `GROQ_API_KEY`: Optional Groq API key
- `TOGETHER_API_KEY`: Optional Together.ai API key

## Development

### Run Locally (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://admin:secure_password@localhost:5432/metadata_db"
export SECRET_KEY="your-secret-key"

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed_data.py

# Start server
uvicorn app.main:app --reload
```

### Run Tests

```bash
pytest
```

### Create Migration

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Security Features

- ✅ Credential encryption at rest (Fernet + PBKDF2)
- ✅ SQL injection prevention (query validation)
- ✅ API key authentication
- ✅ Query timeouts
- ✅ Connection timeouts
- ✅ Input validation (Pydantic)

## Troubleshooting

### View Logs

```bash
docker-compose logs -f analytics_api
```

### Check Database

```bash
docker exec -it metadata_db psql -U admin -d metadata_db
```

### Test Ollama

```bash
curl http://localhost:11434/api/tags
```

### Restart Services

```bash
docker-compose restart
```

## License

MIT


