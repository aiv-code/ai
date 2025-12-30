"""Trino connector."""
from trino.dbapi import connect as trino_connect
from trino import auth as trino_auth
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class TrinoConnector(BaseConnector):
    """Trino connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish Trino connection."""
        try:
            # Build connection parameters
            conn_params = {
                "host": self.connection_config["host"],
                "port": self.connection_config.get("port", 8080),
                "user": self.connection_config.get("username", "admin"),
                "catalog": self.connection_config.get("catalog", "system"),
                "schema": self.connection_config.get("schema", "default"),
                "http_scheme": self.connection_config.get("http_scheme", "http"),
            }
            
            # Add authentication if password is provided
            password = self.connection_config.get("password")
            if password:
                conn_params["auth"] = trino_auth.BasicAuthentication(
                    self.connection_config.get("username", "admin"),
                    password
                )
            
            self._connection = trino_connect(**conn_params)
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Trino: {str(e)}")
    
    def disconnect(self) -> None:
        """Close Trino connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        try:
            cursor = self._connection.cursor()
            
            # Set query timeout if supported
            try:
                cursor.execute(f"SET SESSION query_max_run_time = '{timeout}s'")
            except:
                pass  # Some Trino versions may not support this
            
            cursor.execute(query)
            
            # Fetch column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            result = [dict(zip(columns, row)) for row in rows]
            
            cursor.close()
            return result
        except Exception as e:
            logger.error(f"[TrinoConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        catalog = self.connection_config.get("catalog", "system")
        schema = self.connection_config.get("schema", "default")
        
        query = f"""
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_catalog = '{catalog}'
            AND table_schema = '{schema}'
            ORDER BY table_name, ordinal_position
        """
        
        try:
            cursor = self._connection.cursor()
            cursor.execute(query)
            
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            schema_dict = {}
            for row in rows:
                row_dict = dict(zip(columns, row))
                table_name = row_dict["table_name"]
                if table_name not in schema_dict:
                    schema_dict[table_name] = []
                
                schema_dict[table_name].append({
                    "name": row_dict["column_name"],
                    "type": row_dict["data_type"],
                    "nullable": row_dict["is_nullable"] == "YES",
                    "default": None
                })
            
            cursor.close()
            return schema_dict
        except Exception as e:
            raise RuntimeError(f"Failed to get schema: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test Trino connection."""
        try:
            if not self._connection:
                self.connect()
            
            cursor = self._connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            
            return True
        except Exception:
            return False

