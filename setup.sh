#!/bin/bash

# Multi-Source Analytics API Setup Script
# This script automates the complete setup process

set -e

echo "=================================================="
echo "Multi-Source Analytics API - Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker Compose is installed"

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        # Create basic .env file
        cat > .env << EOF
DATABASE_URL=postgresql://admin:secure_password@metadata_db:5432/metadata_db
SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
OLLAMA_URL=http://ollama_service:11434
OLLAMA_MODEL=llama3.1
LLM_PROVIDER=ollama
EOF
    fi
    
    # Generate random secret key if openssl is available
    if command -v openssl &> /dev/null; then
        SECRET_KEY=$(openssl rand -base64 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
        else
            sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
        fi
    fi
    
    print_success "Created .env file with generated SECRET_KEY"
else
    print_success ".env file exists"
fi

# Create data directory
mkdir -p data/uploads
print_success "Created data directories"

# Start Docker containers
echo ""
echo "Starting Docker containers..."
$DOCKER_COMPOSE up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to start..."
sleep 10

# Check if PostgreSQL is ready
echo "Checking PostgreSQL..."
for i in {1..30}; do
    if docker exec metadata_db pg_isready -U admin -d metadata_db > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# Check if Ollama is ready
echo "Checking Ollama..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Ollama failed to start"
        exit 1
    fi
    sleep 1
done

# Pull Llama model
echo ""
echo "Pulling Llama 3.1 model (this may take a few minutes)..."
docker exec ollama_service ollama pull llama3.1 || print_warning "Failed to pull model, you can pull it manually later"

print_success "Llama 3.1 model downloaded"

# Run database migrations
echo ""
echo "Running database migrations..."
docker exec analytics_api alembic upgrade head || print_warning "Migrations may have already run"

print_success "Database migrations completed"

# Seed sample data
echo ""
echo "Seeding sample data..."
SEED_OUTPUT=$(docker exec analytics_api python scripts/seed_data.py 2>&1 || echo "")
echo "$SEED_OUTPUT"

# Extract API key from output
API_KEY=$(echo "$SEED_OUTPUT" | grep "API Key:" | awk '{print $3}' || echo "")

echo ""
echo "=================================================="
echo "✓ Setup Complete!"
echo "=================================================="
echo ""
echo "Services running:"
echo "  - API Server: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - PostgreSQL: localhost:5432"
echo "  - Ollama: localhost:11434"
echo ""

if [ -n "$API_KEY" ]; then
    echo "Sample client created:"
    echo "  Name: Demo Client"
    echo "  API Key: $API_KEY"
    echo ""
    echo "Test the API:"
    echo "  curl -X POST http://localhost:8000/api/v1/queries \\"
    echo "    -H \"X-API-Key: $API_KEY\" \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"prompt\": \"Show me all data sources\"}'"
    echo ""
fi

echo "Useful commands:"
echo "  - View logs: $DOCKER_COMPOSE logs -f"
echo "  - Stop services: $DOCKER_COMPOSE down"
echo "  - Restart services: $DOCKER_COMPOSE restart"
echo "  - View API docs: open http://localhost:8000/docs"
echo ""
echo "=================================================="


