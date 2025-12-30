"""Initialize database."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import engine, Base
from app.config import settings


def init_db():
    """Initialize database tables."""
    print(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1]}")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()


