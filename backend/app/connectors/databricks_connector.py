"""Databricks connector."""
from databricks import sql
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class DatabricksConnector(BaseConnector):
    """Databricks connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish Databricks connection."""
        try:
            self._connection = sql.connect(
                server_hostname=self.connection_config["host"],
                http_path=self.connection_config["http_path"],
                access_token=self.connection_config.get("token") or self.connection_config.get("access_token"),
            )
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Databricks: {str(e)}")
    
    def disconnect(self) -> None:
        """Close Databricks connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        try:
            cursor = self._connection.cursor()
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
            logger.error(f"[DatabricksConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        catalog = self.connection_config.get("catalog", "hive_metastore")
        schema = self.connection_config.get("schema", "default")
        
        query = f"""
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM {catalog}.information_schema.columns
            WHERE table_schema = '{schema}'
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
        """Test Databricks connection."""
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


