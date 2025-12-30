"""Data source model."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DataSource(Base):
    """Data source model representing a connection to external data."""
    
    __tablename__ = "data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # postgres, excel, parquet
    connection_config = Column(Text, nullable=False)  # Encrypted JSON string
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="data_sources")
    schema_metadata = relationship("SchemaMetadata", back_populates="data_source", cascade="all, delete-orphan")
    query_history = relationship("QueryHistory", back_populates="data_source")


