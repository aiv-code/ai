"""Data source schemas."""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class SourceType(str, Enum):
    """Supported data source types."""
    POSTGRES = "postgres"
    EXCEL = "excel"
    PARQUET = "parquet"
    TIMESCALE = "timescale"
    TRINO = "trino"
    DUCKDB = "duckdb"
    MOTHERDUCK = "motherduck"
    DATABRICKS = "databricks"
    CUBE = "cube"
    SNOWFLAKE = "snowflake"
    REDSHIFT = "redshift"
    BUCKET_PARQUET = "bucket_parquet"


class ConnectionConfig(BaseModel):
    """Base connection configuration."""
    pass


class PostgresConnectionConfig(ConnectionConfig):
    """PostgreSQL connection configuration."""
    host: str
    port: int = Field(default=5432, ge=1, le=65535)
    database: str
    username: str
    password: str
    schema: Optional[str] = None


class ExcelConnectionConfig(ConnectionConfig):
    """Excel/CSV connection configuration."""
    file_path: str
    sheet_name: Optional[str] = None  # For Excel files


class ParquetConnectionConfig(ConnectionConfig):
    """Parquet connection configuration."""
    file_path: str


class DataSourceBase(BaseModel):
    """Base data source schema."""
    source_name: str = Field(..., min_length=1, max_length=255)
    source_type: SourceType


class DataSourceCreate(DataSourceBase):
    """Schema for creating a data source."""
    connection_config: Dict[str, Any] = Field(..., description="Connection configuration as JSON")
    
    @field_validator('connection_config')
    @classmethod
    def validate_connection_config(cls, v: Dict[str, Any], info) -> Dict[str, Any]:
        """Validate connection config based on source type."""
        if hasattr(info, 'data') and 'source_type' in info.data:
            source_type = info.data['source_type']
            if source_type == SourceType.POSTGRES:
                PostgresConnectionConfig(**v)
            elif source_type == SourceType.EXCEL:
                ExcelConnectionConfig(**v)
            elif source_type == SourceType.PARQUET:
                ParquetConnectionConfig(**v)
        return v


class DataSourceUpdate(BaseModel):
    """Schema for updating a data source."""
    source_name: Optional[str] = Field(None, min_length=1, max_length=255)
    connection_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class DataSourceResponse(DataSourceBase):
    """Schema for data source response."""
    id: int
    client_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Note: connection_config is not included in response for security
    
    class Config:
        from_attributes = True

