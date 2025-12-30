"""Query history model for audit trail."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class QueryHistory(Base):
    """Query history model for tracking all queries."""
    
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    prompt = Column(Text, nullable=False)  # Original user prompt
    query_type = Column(String(50), nullable=False)  # sql, filter, etc.
    executed_query = Column(Text, nullable=True)  # Actual query executed
    status = Column(String(50), nullable=False)  # success, error, timeout
    result_count = Column(Integer, nullable=True)
    execution_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    result_preview = Column(JSON, nullable=True)  # First few rows
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    client = relationship("Client", back_populates="query_history")
    data_source = relationship("DataSource", back_populates="query_history")


