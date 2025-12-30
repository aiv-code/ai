"""Data source management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import os
import uuid
from pathlib import Path
from app.database import get_db
from app.api.deps import get_client_by_api_key
from app.models.client import Client
from app.models.data_source import DataSource
from app.schemas.data_source import DataSourceCreate, DataSourceResponse, DataSourceUpdate
from app.utils.security import encrypt_credentials, decrypt_credentials
from app.connectors import PostgresConnector, ExcelConnector, ParquetConnector

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.post("", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
def create_data_source(
    data_source_data: DataSourceCreate,
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """Create a new data source."""
    # Check if data source with same name exists for this client
    existing = db.query(DataSource).filter(
        DataSource.client_id == client.id,
        DataSource.source_name == data_source_data.source_name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source with this name already exists"
        )
    
    # Encrypt connection config
    config_json = json.dumps(data_source_data.connection_config)
    encrypted_config = encrypt_credentials(config_json)
    
    # Create data source
    data_source = DataSource(
        client_id=client.id,
        source_name=data_source_data.source_name,
        source_type=data_source_data.source_type.value,
        connection_config=encrypted_config,
        is_active=True
    )
    
    db.add(data_source)
    db.commit()
    db.refresh(data_source)
    
    return data_source


@router.get("", response_model=List[DataSourceResponse])
def list_data_sources(
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """List all data sources for the authenticated client."""
    data_sources = db.query(DataSource).filter(
        DataSource.client_id == client.id
    ).all()
    return data_sources


@router.get("/{data_source_id}", response_model=DataSourceResponse)
def get_data_source(
    data_source_id: int,
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """Get a specific data source."""
    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.client_id == client.id
    ).first()
    
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    return data_source


@router.patch("/{data_source_id}", response_model=DataSourceResponse)
def update_data_source(
    data_source_id: int,
    data_source_data: DataSourceUpdate,
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """Update a data source."""
    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.client_id == client.id
    ).first()
    
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Update fields
    if data_source_data.source_name is not None:
        data_source.source_name = data_source_data.source_name
    if data_source_data.connection_config is not None:
        config_json = json.dumps(data_source_data.connection_config)
        data_source.connection_config = encrypt_credentials(config_json)
    if data_source_data.is_active is not None:
        data_source.is_active = data_source_data.is_active
    
    db.commit()
    db.refresh(data_source)
    
    return data_source


@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    data_source_id: int,
    client: Client = Depends(get_client_by_api_key),
    db: Session = Depends(get_db)
):
    """Delete a data source."""
    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.client_id == client.id
    ).first()
    
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    db.delete(data_source)
    db.commit()
    
    return None


@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    client: Client = Depends(get_client_by_api_key)
):
    """Upload Excel or Parquet file for data source."""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    allowed_extensions = {'.xlsx', '.xls', '.csv', '.parquet'}
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_name = f"{file_id}{file_ext}"
    file_path = upload_dir / file_name
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Return file info
        return {
            "file_path": str(file_path),
            "file_name": file.filename,
            "file_size": len(content),
            "file_type": file_ext[1:]  # Remove the dot
        }
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/{data_source_id}/preview")
def preview_data_source(
    data_source_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    client: Client = Depends(get_client_by_api_key)
):
    """Preview data from a data source (first N rows)."""
    # Get data source
    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.client_id == client.id
    ).first()
    
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    try:
        # Decrypt connection config
        config_json = decrypt_credentials(data_source.connection_config)
        config = json.loads(config_json)
        
        # Create connector
        connector = None
        if data_source.source_type == "postgres":
            connector = PostgresConnector(config)
        elif data_source.source_type == "excel":
            connector = ExcelConnector(config)
        elif data_source.source_type == "parquet":
            connector = ParquetConnector(config)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported data source type: {data_source.source_type}"
            )
        
        # Get schema and sample data
        with connector:
            schema = connector.get_schema()
            
            # Get sample data - for file-based sources, we can get all data and limit
            # For postgres, we'd need to execute a SELECT LIMIT query
            sample_data = []
            
            if data_source.source_type in ["excel", "parquet"]:
                # For file-based sources, execute empty query to get all data, then limit
                all_data = connector.execute_query("{}")  # Empty filter returns all
                sample_data = all_data[:limit] if all_data else []
            elif data_source.source_type == "postgres":
                # For postgres, get first table and query it
                if schema:
                    table_name = list(schema.keys())[0]
                    query = f"SELECT * FROM {table_name} LIMIT {limit}"
                    sample_data = connector.execute_query(query)
            
            # Format response
            result: Dict[str, Any] = {
                "source_id": data_source.id,
                "source_name": data_source.source_name,
                "source_type": data_source.source_type,
                "schema": schema,
                "sample_data": sample_data,
                "row_count": len(sample_data)
            }
            
            return result
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview data source: {str(e)}"
        )

