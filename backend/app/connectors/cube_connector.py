"""Cube connector."""
import httpx
from typing import List, Dict, Any, Optional
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class CubeConnector(BaseConnector):
    """Cube connector (uses REST API)."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._base_url = None
        self._headers = {}
    
    def connect(self) -> None:
        """Establish Cube connection."""
        try:
            self._base_url = self.connection_config.get("base_url", "http://localhost:4000")
            if not self._base_url.endswith("/"):
                self._base_url += "/"
            
            # Set up authentication headers
            token = self.connection_config.get("token") or self.connection_config.get("api_key")
            if token:
                self._headers["Authorization"] = f"Bearer {token}"
            
            # Test connection
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{self._base_url}cubejs-api/v1/run-scheduled-refresh",
                    headers=self._headers
                )
                # We don't care about the response, just that we can connect
                
        except Exception as e:
            logger.warning(f"Initial connection test failed (may be normal): {str(e)}")
            # Don't raise - Cube API might not have this endpoint
    
    def disconnect(self) -> None:
        """Close Cube connection."""
        # No persistent connection for REST API
        pass
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """
        Execute query using Cube API.
        
        Query can be:
        - A JSON query object (as string)
        - A SQL query (if Cube supports SQL)
        """
        if not self._base_url:
            self.connect()
        
        try:
            import json
            
            # Try to parse as JSON query
            try:
                query_obj = json.loads(query) if isinstance(query, str) else query
            except:
                # If not JSON, treat as SQL (if supported)
                query_obj = {"query": query}
            
            # Use Cube's load endpoint
            url = f"{self._base_url}cubejs-api/v1/load"
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    url,
                    json=query_obj,
                    headers=self._headers
                )
                response.raise_for_status()
                
                data = response.json()
                
                # Cube returns data in a specific format
                # Extract the actual data rows
                if isinstance(data, dict) and "data" in data:
                    return data["data"]
                elif isinstance(data, list):
                    return data
                else:
                    # Try to extract from common Cube response format
                    return [data] if data else []
                    
        except httpx.HTTPError as e:
            logger.error(f"[CubeConnector] HTTP error: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
        except Exception as e:
            logger.error(f"[CubeConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information (meta endpoint)."""
        if not self._base_url:
            self.connect()
        
        try:
            url = f"{self._base_url}cubejs-api/v1/meta"
            
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self._headers)
                response.raise_for_status()
                
                meta = response.json()
                
                # Parse Cube meta format
                schema = {}
                
                if "cubes" in meta:
                    for cube in meta["cubes"]:
                        cube_name = cube.get("name", "unknown")
                        schema[cube_name] = []
                        
                        # Get measures
                        for measure in cube.get("measures", []):
                            schema[cube_name].append({
                                "name": measure.get("name", ""),
                                "type": measure.get("type", "number"),
                                "nullable": True,
                                "default": None
                            })
                        
                        # Get dimensions
                        for dimension in cube.get("dimensions", []):
                            schema[cube_name].append({
                                "name": dimension.get("name", ""),
                                "type": dimension.get("type", "string"),
                                "nullable": True,
                                "default": None
                            })
                
                return schema
        except Exception as e:
            raise RuntimeError(f"Failed to get schema: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test Cube connection."""
        try:
            if not self._base_url:
                self.connect()
            
            url = f"{self._base_url}cubejs-api/v1/meta"
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=self._headers)
                response.raise_for_status()
                return True
        except Exception:
            return False


