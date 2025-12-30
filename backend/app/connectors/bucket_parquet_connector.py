"""Cloud bucket connector for Parquet files."""
import pandas as pd
import pyarrow.parquet as pq
from typing import List, Dict, Any, Optional
import logging
import io
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class BucketParquetConnector(BaseConnector):
    """
    Connector for Parquet files stored in cloud buckets.
    Supports: AWS S3, Google Cloud Storage, Azure Blob Storage, Cloudflare R2
    """
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._client = None
        self._bucket_name = connection_config["bucket_name"]
        self._provider = connection_config.get("provider", "s3").lower()  # s3, gcs, azure, r2
        self._prefix = connection_config.get("prefix", "")  # Optional path prefix
        self._parquet_files = []
        self._dataframes = {}
    
    def connect(self) -> None:
        """Establish connection to cloud bucket and list Parquet files."""
        try:
            if self._provider == "s3" or self._provider == "r2":
                import boto3
                from botocore.exceptions import ClientError
                
                # For R2, use custom endpoint
                if self._provider == "r2":
                    endpoint_url = self.connection_config.get("endpoint_url")
                    if not endpoint_url:
                        raise ValueError("endpoint_url is required for R2 provider")
                    
                    self._client = boto3.client(
                        's3',
                        endpoint_url=endpoint_url,
                        aws_access_key_id=self.connection_config.get("access_key_id"),
                        aws_secret_access_key=self.connection_config.get("secret_access_key"),
                    )
                else:
                    # Standard S3
                    self._client = boto3.client(
                        's3',
                        aws_access_key_id=self.connection_config.get("access_key_id"),
                        aws_secret_access_key=self.connection_config.get("secret_access_key"),
                        region_name=self.connection_config.get("region", "us-east-1")
                    )
                
                # List Parquet files
                paginator = self._client.get_paginator('list_objects_v2')
                pages = paginator.paginate(Bucket=self._bucket_name, Prefix=self._prefix)
                
                for page in pages:
                    if 'Contents' in page:
                        for obj in page['Contents']:
                            key = obj['Key']
                            if key.lower().endswith('.parquet'):
                                self._parquet_files.append(key)
                
            elif self._provider == "gcs":
                from google.cloud import storage
                
                credentials_path = self.connection_config.get("credentials_path")
                credentials_json = self.connection_config.get("credentials_json")
                
                if credentials_path:
                    self._client = storage.Client.from_service_account_json(credentials_path)
                elif credentials_json:
                    import json
                    credentials_dict = json.loads(credentials_json) if isinstance(credentials_json, str) else credentials_json
                    self._client = storage.Client.from_service_account_info(credentials_dict)
                else:
                    # Use default credentials
                    self._client = storage.Client()
                
                bucket = self._client.bucket(self._bucket_name)
                blobs = bucket.list_blobs(prefix=self._prefix)
                
                for blob in blobs:
                    if blob.name.lower().endswith('.parquet'):
                        self._parquet_files.append(blob.name)
                
            elif self._provider == "azure":
                from azure.storage.blob import BlobServiceClient
                
                connection_string = self.connection_config.get("connection_string")
                account_name = self.connection_config.get("account_name")
                account_key = self.connection_config.get("account_key")
                
                if connection_string:
                    self._client = BlobServiceClient.from_connection_string(connection_string)
                elif account_name and account_key:
                    account_url = f"https://{account_name}.blob.core.windows.net"
                    from azure.storage.blob import BlobServiceClient
                    from azure.core.credentials import AzureNamedKeyCredential
                    credential = AzureNamedKeyCredential(account_name, account_key)
                    self._client = BlobServiceClient(account_url=account_url, credential=credential)
                else:
                    raise ValueError("Azure requires either connection_string or (account_name and account_key)")
                
                container_client = self._client.get_container_client(self._bucket_name)
                blobs = container_client.list_blobs(name_starts_with=self._prefix)
                
                for blob in blobs:
                    if blob.name.lower().endswith('.parquet'):
                        self._parquet_files.append(blob.name)
                
            else:
                raise ValueError(f"Unsupported provider: {self._provider}")
            
            logger.info(f"[BucketParquetConnector] Found {len(self._parquet_files)} Parquet files")
            
        except Exception as e:
            raise ConnectionError(f"Failed to connect to {self._provider} bucket: {str(e)}")
    
    def disconnect(self) -> None:
        """Close connection and clear loaded data."""
        self._client = None
        self._dataframes = {}
        self._parquet_files = []
    
    def _load_parquet_file(self, file_key: str) -> pd.DataFrame:
        """Load a Parquet file from the bucket into a DataFrame."""
        if file_key in self._dataframes:
            return self._dataframes[file_key]
        
        try:
            if self._provider == "s3" or self._provider == "r2":
                # Download from S3/R2
                obj = self._client.get_object(Bucket=self._bucket_name, Key=file_key)
                parquet_data = obj['Body'].read()
                df = pd.read_parquet(io.BytesIO(parquet_data))
                
            elif self._provider == "gcs":
                # Download from GCS
                bucket = self._client.bucket(self._bucket_name)
                blob = bucket.blob(file_key)
                parquet_data = blob.download_as_bytes()
                df = pd.read_parquet(io.BytesIO(parquet_data))
                
            elif self._provider == "azure":
                # Download from Azure Blob
                container_client = self._client.get_container_client(self._bucket_name)
                blob_client = container_client.get_blob_client(file_key)
                parquet_data = blob_client.download_blob().readall()
                df = pd.read_parquet(io.BytesIO(parquet_data))
            
            self._dataframes[file_key] = df
            return df
            
        except Exception as e:
            raise RuntimeError(f"Failed to load Parquet file {file_key}: {str(e)}")
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """
        Execute query on Parquet files.
        
        Query format: JSON filter expression or SQL-like query string.
        If query is a string starting with "SELECT", it will be parsed as SQL.
        Otherwise, it's treated as a JSON filter expression.
        """
        if not self._client:
            self.connect()
        
        try:
            import json
            import operator as op
            
            # Check if query is SQL-like
            if isinstance(query, str) and query.strip().upper().startswith("SELECT"):
                # Parse SQL query to extract table and filters
                # Simple SQL parser - can be enhanced
                # For now, treat as filter on all files
                filter_expr = {}
            else:
                # Parse filter query
                filter_expr = json.loads(query) if isinstance(query, str) else query
            
            # If empty dict or empty list, return all rows from all files
            if (isinstance(filter_expr, dict) and not filter_expr) or (isinstance(filter_expr, list) and not filter_expr):
                all_results = []
                for file_key in self._parquet_files:
                    df = self._load_parquet_file(file_key)
                    all_results.extend(df.to_dict('records'))
                return all_results
            
            # Apply filters
            all_results = []
            for file_key in self._parquet_files:
                df = self._load_parquet_file(file_key)
                df_filtered = df.copy()
                
                if isinstance(filter_expr, dict):
                    df_filtered = self._apply_filter(df_filtered, filter_expr)
                elif isinstance(filter_expr, list):
                    for f in filter_expr:
                        df_filtered = self._apply_filter(df_filtered, f)
                
                all_results.extend(df_filtered.to_dict('records'))
            
            return all_results
        except Exception as e:
            logger.error(f"[BucketParquetConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def _apply_filter(self, df: pd.DataFrame, filter_expr: Dict[str, Any]) -> pd.DataFrame:
        """Apply a single filter expression."""
        import operator as op
        
        column = filter_expr.get("column")
        operator = filter_expr.get("operator", "==")
        value = filter_expr.get("value")
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found")
        
        # Map operators
        op_map = {
            "==": op.eq,
            "!=": op.ne,
            ">": op.gt,
            ">=": op.ge,
            "<": op.lt,
            "<=": op.le,
            "in": lambda x, y: x.isin(y),
            "contains": lambda x, y: x.str.contains(y, na=False),
        }
        
        if operator not in op_map:
            raise ValueError(f"Unsupported operator: {operator}")
        
        return df[op_map[operator](df[column], value)]
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information from all Parquet files."""
        if not self._client:
            self.connect()
        
        schema = {}
        
        # Get schema from first file of each "table" (using filename as table name)
        for file_key in self._parquet_files:
            try:
                # Use filename (without extension) as table name
                table_name = file_key.split('/')[-1].replace('.parquet', '').replace('.PARQUET', '')
                
                if table_name not in schema:
                    # Load file to get schema
                    df = self._load_parquet_file(file_key)
                    
                    schema[table_name] = []
                    for col in df.columns:
                        dtype = str(df[col].dtype)
                        schema[table_name].append({
                            "name": col,
                            "type": dtype,
                            "nullable": df[col].isna().any(),
                            "default": None
                        })
            except Exception as e:
                logger.warning(f"Failed to get schema for {file_key}: {str(e)}")
                continue
        
        return schema
    
    def test_connection(self) -> bool:
        """Test bucket connection."""
        try:
            if not self._client:
                self.connect()
            
            # Try to list at least one object
            if len(self._parquet_files) == 0:
                # Connection might be valid but no files found
                logger.warning("No Parquet files found in bucket")
                return True  # Connection is valid even if no files
            
            return True
        except Exception:
            return False


