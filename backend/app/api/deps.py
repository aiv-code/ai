"""API dependencies."""
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client


def get_client_by_api_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> Client:
    """
    Dependency to get client by API key.
    
    Raises:
        HTTPException: If API key is invalid or client is inactive
    """
    client = db.query(Client).filter(Client.api_key == x_api_key).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    if not client.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client account is inactive"
        )
    
    return client

