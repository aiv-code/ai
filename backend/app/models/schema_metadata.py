"""Schema metadata model for caching table/column information."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SchemaMetadata(Base):
    """Schema metadata model for caching data source schemas."""
    
    __tablename__ = "schema_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    schema_name = Column(String(255), nullable=True)  # For databases
    table_name = Column(String(255), nullable=False)
    column_info = Column(JSON, nullable=False)  # List of column metadata
    sample_data = Column(JSON, nullable=True)  # Sample rows for preview
    last_refreshed = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="schema_metadata")
    
    # Unique constraint on data_source_id + table_name
    __table_args__ = (
        {"extend_existing": True},
    )


