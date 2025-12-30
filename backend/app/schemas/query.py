"""Query schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal


class QueryRequest(BaseModel):
    """Schema for query request."""
    prompt: str = Field(..., min_length=1, description="Natural language query prompt")
    data_source_ids: Optional[List[int]] = Field(None, description="Specific data sources to query (optional)")
    max_rows: Optional[int] = Field(1000, ge=1, le=10000, description="Maximum rows to return")


class Visualization(BaseModel):
    """Visualization suggestion."""
    type: Literal["bar", "line", "pie", "table", "kpi", "scatter", "dashboard"]
    config: Dict[str, Any] = Field(..., description="Visualization configuration")


class QueryMetadata(BaseModel):
    """Query execution metadata."""
    sources_used: List[str]
    execution_time_ms: float
    row_count: int
    query_type: str


class QueryResponse(BaseModel):
    """Schema for query response."""
    status: Literal["success", "error"]
    data: Optional[List[Dict[str, Any]]] = None
    visualizations: Optional[List[Visualization]] = None
    metadata: Optional[QueryMetadata] = None
    error_message: Optional[str] = None
    executed_query: Optional[str] = Field(None, description="The SQL or filter query that was executed")
    available_tables: Optional[List[str]] = Field(None, description="Available tables in the data source")

