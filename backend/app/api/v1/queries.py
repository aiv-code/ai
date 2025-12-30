"""Query execution endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_client_by_api_key
from app.models.client import Client
from app.schemas.query import QueryRequest, QueryResponse
from app.services.orchestrator import QueryOrchestrator

router = APIRouter(prefix="/queries", tags=["queries"])


@router.post("", response_model=QueryResponse)
def execute_query(
    query_request: QueryRequest,
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """Execute a natural language query."""
    try:
        orchestrator = QueryOrchestrator(db, client.id)
        result = orchestrator.execute_query(
            prompt=query_request.prompt,
            data_source_ids=query_request.data_source_ids,
            max_rows=query_request.max_rows or 1000
        )
        return result
    except Exception as e:
        return QueryResponse(
            status="error",
            error_message=str(e)
        )


