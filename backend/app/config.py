"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings."""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Multi-Source Analytics API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "postgresql://admin:secure_password@metadata_db:5432/metadata_db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Encryption
    ENCRYPTION_KEY: Optional[str] = None  # Will be generated if not provided
    
    # LLM Settings
    OLLAMA_URL: str = "http://ollama_service:11434"
    OLLAMA_MODEL: str = "llama3.1"
    LLM_PROVIDER: str = "ollama"  # ollama, groq, together
    
    # Groq API (optional)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    
    # Together.ai API (optional)
    TOGETHER_API_KEY: Optional[str] = None
    TOGETHER_MODEL: str = "meta-llama/Llama-3-70b-chat-hf"
    
    # Query Settings
    MAX_QUERY_TIMEOUT: int = 300  # seconds
    MAX_RESULT_ROWS: int = 10000
    
    # File Upload
    UPLOAD_DIR: str = "/data/uploads"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

